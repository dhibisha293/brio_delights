import logging
import os
from datetime import date
from typing import Dict, List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from supabase import Client, ClientOptions, create_client

logger = logging.getLogger("brio")

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
SUPABASE_SSL_VERIFY = os.getenv("SUPABASE_SSL_VERIFY", "true").lower() not in ("0", "false", "no")

app = FastAPI(title="Brio Delights API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_ORIGIN,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase is not configured. Copy backend/.env.example to backend/.env and add your project keys.",
        )
    return create_client(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        options=ClientOptions(httpx_client=httpx.Client(verify=SUPABASE_SSL_VERIFY)),
    )


class SignupBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    display_name: str = Field(min_length=1, max_length=80)
    bakery_name: str = Field(min_length=1, max_length=80)


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class UserOut(BaseModel):
    id: str
    email: str
    display_name: str
    bakery_name: str


class AuthOut(BaseModel):
    access_token: str
    user: UserOut


class PantryIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    quantity: float = Field(gt=0)
    unit: str = Field(min_length=1, max_length=20)
    cost: float = Field(ge=0)
    purchased_at: date


class PantryOut(BaseModel):
    id: str
    name: str
    quantity: float
    unit: str
    cost: float
    purchased_at: date


class IngredientIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    category: str = Field(min_length=1, max_length=80)
    unit: str = Field(min_length=1, max_length=20)
    minimum_stock: float = Field(ge=0)
    notes: Optional[str] = None


class IngredientOut(IngredientIn):
    id: str
    created_at: str
    current_stock: float = 0.0
    has_unknown_stock: bool = False


class PurchaseIn(BaseModel):
    shop_name: Optional[str] = None
    purchase_date: Optional[date] = None
    quantity: Optional[float] = None
    price: Optional[float] = None
    expiry_date: Optional[date] = None
    notes: Optional[str] = None
    is_opening_stock: bool = False


class PurchaseOut(PurchaseIn):
    id: str
    ingredient_id: str
    remaining_quantity: Optional[float] = None
    created_at: str


class ConsumeIn(BaseModel):
    quantity: float = Field(gt=0)


class RecipeIngredientIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    quantity: float = Field(gt=0)
    unit: str = Field(min_length=1, max_length=20)


class RecipeIngredientOut(RecipeIngredientIn):
    id: str


class RecipeIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    selling_price: Optional[float] = Field(default=None, ge=0)
    ingredients: List[RecipeIngredientIn] = Field(min_length=1)


class RecipeOut(BaseModel):
    id: str
    name: str
    selling_price: Optional[float] = None
    ingredients: List[RecipeIngredientOut]
    estimated_cost: Optional[float] = None


def _auth_error(message: str, code: int = status.HTTP_400_BAD_REQUEST) -> HTTPException:
    return HTTPException(status_code=code, detail=message)


def _profile_for_user(sb: Client, user_id: str, email: str) -> UserOut:
    result = sb.table("profiles").select("display_name, bakery_name").eq("id", user_id).maybe_single().execute()
    data = result.data or {}
    return UserOut(
        id=user_id,
        email=email,
        display_name=data.get("display_name") or "",
        bakery_name=data.get("bakery_name") or "",
    )


def _save_profile_and_session(sb: Client, body: SignupBody, user_id: str, email: str) -> AuthOut:
    try:
        sb.table("profiles").upsert(
            {
                "id": user_id,
                "display_name": body.display_name.strip(),
                "bakery_name": body.bakery_name.strip(),
            },
            on_conflict="id",
        ).execute()
    except Exception as exc:
        logger.exception("Supabase profiles upsert failed: %s", exc)
        detail = str(exc)
        if "PGRST205" in detail or "schema cache" in detail.lower() or "could not find the table" in detail.lower():
            raise _auth_error(
                "Account was created, but the profiles table is missing. Run backend/schema.sql in the Supabase SQL editor."
            ) from exc
        if "row-level security" in detail.lower() or "42501" in detail:
            raise _auth_error(
                "Account was created, but saving the bakery profile was blocked. Run the updated backend/schema.sql in the Supabase SQL editor."
            ) from exc
        raise _auth_error(
            "Account was created, but the bakery profile could not be saved. Run backend/schema.sql in the Supabase SQL editor, then try Login."
        ) from exc

    session = sb.auth.sign_in_with_password({"email": body.email, "password": body.password})
    if session.session is None or session.user is None:
        raise _auth_error("Account created, but login failed. Try logging in.")

    return AuthOut(
        access_token=session.session.access_token,
        user=_profile_for_user(sb, session.user.id, session.user.email or email),
    )


def _finish_signup_for_existing_email(sb: Client, body: SignupBody) -> AuthOut:
    try:
        session = sb.auth.sign_in_with_password({"email": body.email, "password": body.password})
    except Exception as exc:
        raise _auth_error("That email is already registered. Try logging in.") from exc

    if session.session is None or session.user is None:
        raise _auth_error("That email is already registered. Try logging in.")

    return _save_profile_and_session(sb, body, session.user.id, session.user.email or body.email)


def _bearer_token(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise _auth_error("Please log in.", status.HTTP_401_UNAUTHORIZED)
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise _auth_error("Please log in.", status.HTTP_401_UNAUTHORIZED)
    return token


def _current_user_id(token: str = Depends(_bearer_token)) -> str:
    sb = get_supabase()
    try:
        user_res = sb.auth.get_user(token)
    except Exception as exc:
        raise _auth_error("Your session expired. Please log in again.", status.HTTP_401_UNAUTHORIZED) from exc
    user = user_res.user
    if user is None:
        raise _auth_error("Your session expired. Please log in again.", status.HTTP_401_UNAUTHORIZED)
    return user.id


def _missing_table_error(exc: Exception, table: str) -> HTTPException:
    detail = str(exc)
    logger.exception("%s query failed: %s", table, exc)
    if "PGRST205" in detail or "schema cache" in detail.lower() or "could not find the table" in detail.lower():
        return _auth_error("The pantry/recipes tables are missing. Run backend/schema.sql in the Supabase SQL editor.")
    if "row-level security" in detail.lower() or "42501" in detail:
        return _auth_error("Saving was blocked by database permissions. Run the latest backend/schema.sql in the Supabase SQL editor.")
    return _auth_error("Could not save that. Check the details and try again.")


def _unit_costs(sb: Client, user_id: str) -> Dict[str, float]:
    result = (
        sb.table("pantry_items")
        .select("name, quantity, cost, unit, purchased_at")
        .eq("user_id", user_id)
        .order("purchased_at", desc=True)
        .execute()
    )
    costs: Dict[str, float] = {}
    for row in result.data or []:
        key = f"{str(row['name']).strip().lower()}|{str(row['unit']).strip().lower()}"
        if key in costs:
            continue
        quantity = float(row["quantity"])
        if quantity > 0:
            costs[key] = float(row["cost"]) / quantity
    return costs


def _recipe_cost(ingredients: list, costs: Dict[str, float]) -> Optional[float]:
    total = 0.0
    matched = False
    for item in ingredients:
        key = f"{item['name'].strip().lower()}|{item['unit'].strip().lower()}"
        unit_cost = costs.get(key)
        if unit_cost is None:
            continue
        matched = True
        total += unit_cost * float(item["quantity"])
    return round(total, 2) if matched else None


def _pantry_out(row: dict) -> PantryOut:
    return PantryOut(
        id=row["id"],
        name=row["name"],
        quantity=float(row["quantity"]),
        unit=row["unit"],
        cost=float(row["cost"]),
        purchased_at=row["purchased_at"],
    )


def _recipe_out(row: dict, costs: Dict[str, float]) -> RecipeOut:
    ingredients = row.get("recipe_ingredients") or []
    return RecipeOut(
        id=row["id"],
        name=row["name"],
        selling_price=None if row.get("selling_price") is None else float(row["selling_price"]),
        ingredients=[
            RecipeIngredientOut(
                id=item["id"],
                name=item["name"],
                quantity=float(item["quantity"]),
                unit=item["unit"],
            )
            for item in ingredients
        ],
        estimated_cost=_recipe_cost(ingredients, costs),
    )


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/auth/signup", response_model=AuthOut)
def signup(body: SignupBody):
    sb = get_supabase()
    try:
        created = sb.auth.admin.create_user(
            {
                "email": body.email,
                "password": body.password,
                "email_confirm": True,
                "user_metadata": {
                    "display_name": body.display_name,
                    "bakery_name": body.bakery_name,
                },
            }
        )
    except Exception as exc:
        logger.exception("Supabase signup failed: %s", exc)
        text = str(exc).lower()
        if "already" in text or "registered" in text or "exists" in text:
            return _finish_signup_for_existing_email(sb, body)
        raise _auth_error("Could not create the account. Check your details and try again.") from exc

    user = created.user
    if user is None:
        raise _auth_error("Could not create the account.")

    return _save_profile_and_session(sb, body, user.id, body.email)


@app.post("/auth/login", response_model=AuthOut)
def login(body: LoginBody):
    sb = get_supabase()
    try:
        session = sb.auth.sign_in_with_password({"email": body.email, "password": body.password})
    except Exception as exc:
        raise _auth_error("Wrong email or password.", status.HTTP_401_UNAUTHORIZED) from exc

    if session.session is None or session.user is None:
        raise _auth_error("Wrong email or password.", status.HTTP_401_UNAUTHORIZED)

    return AuthOut(
        access_token=session.session.access_token,
        user=_profile_for_user(sb, session.user.id, session.user.email or body.email),
    )


@app.get("/auth/me", response_model=UserOut)
def me(token: str = Depends(_bearer_token)):
    sb = get_supabase()
    try:
        user_res = sb.auth.get_user(token)
    except Exception as exc:
        raise _auth_error("Your session expired. Please log in again.", status.HTTP_401_UNAUTHORIZED) from exc

    user = user_res.user
    if user is None:
        raise _auth_error("Your session expired. Please log in again.", status.HTTP_401_UNAUTHORIZED)

    return _profile_for_user(sb, user.id, user.email or "")


@app.post("/auth/logout")
def logout(token: str = Depends(_bearer_token)):
    sb = get_supabase()
    try:
        sb.auth.admin.sign_out(token)
    except Exception:
        pass
    return {"ok": True}


@app.get("/pantry", response_model=List[PantryOut])
def list_pantry(user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        result = (
            sb.table("pantry_items")
            .select("id, name, quantity, unit, cost, purchased_at")
            .eq("user_id", user_id)
            .order("purchased_at", desc=True)
            .execute()
        )
    except Exception as exc:
        raise _missing_table_error(exc, "pantry_items")
    return [_pantry_out(row) for row in (result.data or [])]


@app.post("/pantry", response_model=PantryOut)
def add_pantry(body: PantryIn, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        result = (
            sb.table("pantry_items")
            .insert(
                {
                    "user_id": user_id,
                    "name": body.name.strip(),
                    "quantity": body.quantity,
                    "unit": body.unit.strip(),
                    "cost": body.cost,
                    "purchased_at": body.purchased_at.isoformat(),
                }
            )
            .execute()
        )
    except Exception as exc:
        raise _missing_table_error(exc, "pantry_items")
    rows = result.data or []
    if not rows:
        raise _auth_error("Could not save that pantry item.")
    return _pantry_out(rows[0])


@app.delete("/pantry/{item_id}")
def delete_pantry(item_id: str, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        sb.table("pantry_items").delete().eq("id", item_id).eq("user_id", user_id).execute()
    except Exception as exc:
        raise _missing_table_error(exc, "pantry_items")
    return {"ok": True}


@app.get("/recipes", response_model=List[RecipeOut])
def list_recipes(user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        result = (
            sb.table("recipes")
            .select("id, name, selling_price, recipe_ingredients(id, name, quantity, unit)")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        costs = _unit_costs(sb, user_id)
    except Exception as exc:
        raise _missing_table_error(exc, "recipes")
    return [_recipe_out(row, costs) for row in (result.data or [])]


@app.post("/recipes", response_model=RecipeOut)
def add_recipe(body: RecipeIn, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        created = (
            sb.table("recipes")
            .insert(
                {
                    "user_id": user_id,
                    "name": body.name.strip(),
                    "selling_price": body.selling_price,
                }
            )
            .execute()
        )
        rows = created.data or []
        if not rows:
            raise _auth_error("Could not save that recipe.")
        recipe_id = rows[0]["id"]
        ingredients = (
            sb.table("recipe_ingredients")
            .insert(
                [
                    {
                        "recipe_id": recipe_id,
                        "name": item.name.strip(),
                        "quantity": item.quantity,
                        "unit": item.unit.strip(),
                    }
                    for item in body.ingredients
                ]
            )
            .execute()
        )
        costs = _unit_costs(sb, user_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise _missing_table_error(exc, "recipes")
    recipe_row = dict(rows[0])
    recipe_row["recipe_ingredients"] = ingredients.data or []
    return _recipe_out(recipe_row, costs)


@app.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: str, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        sb.table("recipes").delete().eq("id", recipe_id).eq("user_id", user_id).execute()
    except Exception as exc:
        raise _missing_table_error(exc, "recipes")
    return {"ok": True}


# -----------------------------------------------------------------------------
# NEW PANTRY MODULE
# -----------------------------------------------------------------------------

def _ingredient_out(row: dict, current_stock: float = 0.0, has_unknown_stock: bool = False) -> IngredientOut:
    return IngredientOut(
        id=row["id"],
        name=row["name"],
        category=row["category"],
        unit=row["unit"],
        minimum_stock=float(row["minimum_stock"]),
        notes=row.get("notes"),
        created_at=row["created_at"],
        current_stock=current_stock,
        has_unknown_stock=has_unknown_stock,
    )


def _purchase_out(row: dict) -> PurchaseOut:
    return PurchaseOut(
        id=row["id"],
        ingredient_id=row["ingredient_id"],
        shop_name=row.get("shop_name"),
        purchase_date=row.get("purchase_date"),
        quantity=float(row["quantity"]) if row.get("quantity") is not None else None,
        remaining_quantity=float(row["remaining_quantity"]) if row.get("remaining_quantity") is not None else None,
        price=float(row["price"]) if row.get("price") is not None else None,
        expiry_date=row.get("expiry_date"),
        notes=row.get("notes"),
        created_at=row["created_at"],
        is_opening_stock=row.get("is_opening_stock", False),
    )


@app.get("/ingredients", response_model=List[IngredientOut])
def list_ingredients(user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        # Fetch ingredients
        ing_result = sb.table("ingredients").select("*").eq("user_id", user_id).order("name").execute()
        ingredients = ing_result.data or []

        # Fetch all purchases to calculate current stock
        purchases_result = sb.table("ingredient_purchases").select("ingredient_id, remaining_quantity").eq("user_id", user_id).execute()
        purchases = purchases_result.data or []

        # Aggregate stock
        stock_map = {}
        unknown_map = {}
        for p in purchases:
            i_id = p["ingredient_id"]
            if p.get("remaining_quantity") is None:
                unknown_map[i_id] = True
            else:
                stock_map[i_id] = stock_map.get(i_id, 0.0) + float(p["remaining_quantity"])

        return [_ingredient_out(row, stock_map.get(row["id"], 0.0), unknown_map.get(row["id"], False)) for row in ingredients]
    except Exception as exc:
        raise _missing_table_error(exc, "ingredients")


@app.post("/ingredients", response_model=IngredientOut)
def add_ingredient(body: IngredientIn, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        result = sb.table("ingredients").insert({
            "user_id": user_id,
            "name": body.name.strip(),
            "category": body.category.strip(),
            "unit": body.unit.strip(),
            "minimum_stock": body.minimum_stock,
            "notes": body.notes.strip() if body.notes else None
        }).execute()
        rows = result.data or []
        if not rows:
            raise _auth_error("Could not save that ingredient.")
        return _ingredient_out(rows[0])
    except Exception as exc:
        raise _missing_table_error(exc, "ingredients")


@app.put("/ingredients/{item_id}", response_model=IngredientOut)
def update_ingredient(item_id: str, body: IngredientIn, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        result = sb.table("ingredients").update({
            "name": body.name.strip(),
            "category": body.category.strip(),
            "unit": body.unit.strip(),
            "minimum_stock": body.minimum_stock,
            "notes": body.notes.strip() if body.notes else None
        }).eq("id", item_id).eq("user_id", user_id).execute()
        rows = result.data or []
        if not rows:
            raise _auth_error("Ingredient not found.")
        
        # Recalculate stock for the single item
        purchases_res = sb.table("ingredient_purchases").select("remaining_quantity").eq("ingredient_id", item_id).execute()
        batches = purchases_res.data or []
        stock = sum(float(p["remaining_quantity"]) for p in batches if p.get("remaining_quantity") is not None)
        has_unknown = any(p.get("remaining_quantity") is None for p in batches)
        
        return _ingredient_out(rows[0], stock, has_unknown)
    except Exception as exc:
        raise _missing_table_error(exc, "ingredients")


@app.delete("/ingredients/{item_id}")
def delete_ingredient(item_id: str, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        sb.table("ingredients").delete().eq("id", item_id).eq("user_id", user_id).execute()
    except Exception as exc:
        raise _missing_table_error(exc, "ingredients")
    return {"ok": True}


@app.get("/ingredients/{item_id}/purchases", response_model=List[PurchaseOut])
def list_purchases(item_id: str, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        result = (
            sb.table("ingredient_purchases")
            .select("*")
            .eq("ingredient_id", item_id)
            .eq("user_id", user_id)
            .order("purchase_date", desc=True)
            .order("created_at", desc=True)
            .execute()
        )
        return [_purchase_out(row) for row in (result.data or [])]
    except Exception as exc:
        raise _missing_table_error(exc, "ingredient_purchases")


@app.post("/ingredients/{item_id}/purchases", response_model=PurchaseOut)
def add_purchase(item_id: str, body: PurchaseIn, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        result = sb.table("ingredient_purchases").insert({
            "ingredient_id": item_id,
            "user_id": user_id,
            "shop_name": body.shop_name.strip() if body.shop_name else None,
            "purchase_date": body.purchase_date.isoformat() if body.purchase_date else None,
            "quantity": body.quantity,
            "remaining_quantity": body.quantity,
            "price": body.price,
            "expiry_date": body.expiry_date.isoformat() if body.expiry_date else None,
            "notes": body.notes.strip() if body.notes else None,
            "is_opening_stock": body.is_opening_stock
        }).execute()
        rows = result.data or []
        if not rows:
            raise _auth_error("Could not save that purchase.")
        return _purchase_out(rows[0])
    except Exception as exc:
        raise _missing_table_error(exc, "ingredient_purchases")


@app.put("/ingredients/{item_id}/purchases/{purchase_id}", response_model=PurchaseOut)
def update_purchase(item_id: str, purchase_id: str, body: PurchaseIn, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        result = sb.table("ingredient_purchases").update({
            "shop_name": body.shop_name.strip() if body.shop_name else None,
            "purchase_date": body.purchase_date.isoformat() if body.purchase_date else None,
            "quantity": body.quantity,
            "remaining_quantity": body.quantity, # when updating an opening stock, remaining should be set to the initial quantity
            "price": body.price,
            "expiry_date": body.expiry_date.isoformat() if body.expiry_date else None,
            "notes": body.notes.strip() if body.notes else None,
        }).eq("id", purchase_id).eq("ingredient_id", item_id).eq("user_id", user_id).execute()
        rows = result.data or []
        if not rows:
            raise _auth_error("Purchase not found or could not update.")
        return _purchase_out(rows[0])
    except Exception as exc:
        raise _missing_table_error(exc, "ingredient_purchases")


@app.post("/ingredients/{item_id}/consume")
def consume_ingredient(item_id: str, body: ConsumeIn, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        # FIFO Logic: fetch purchases with remaining_quantity > 0 ordered by oldest date first
        result = (
            sb.table("ingredient_purchases")
            .select("id, remaining_quantity")
            .eq("ingredient_id", item_id)
            .eq("user_id", user_id)
            .gt("remaining_quantity", 0)
            .order("purchase_date")
            .order("created_at")
            .execute()
        )
        
        batches = result.data or []
        remaining_to_consume = body.quantity
        
        # Calculate if we have enough total stock
        total_available = sum(float(b["remaining_quantity"]) for b in batches)
        if total_available < remaining_to_consume:
            raise _auth_error(f"Not enough stock. Available: {total_available}, Requested: {remaining_to_consume}")

        for batch in batches:
            if remaining_to_consume <= 0:
                break
                
            batch_qty = float(batch["remaining_quantity"])
            if batch_qty <= remaining_to_consume:
                # Consume entire batch
                sb.table("ingredient_purchases").update({"remaining_quantity": 0}).eq("id", batch["id"]).execute()
                remaining_to_consume -= batch_qty
            else:
                # Consume partial batch
                new_qty = batch_qty - remaining_to_consume
                sb.table("ingredient_purchases").update({"remaining_quantity": new_qty}).eq("id", batch["id"]).execute()
                remaining_to_consume = 0

        return {"ok": True}
    except HTTPException:
        raise
    except Exception as exc:
        raise _missing_table_error(exc, "ingredient_purchases")
