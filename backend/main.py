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
from services.ai_service import get_ai_response

logger = logging.getLogger("brio")

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
SUPABASE_SSL_VERIFY = os.getenv("SUPABASE_SSL_VERIFY", "true").lower() not in ("0", "false", "no")

app = FastAPI(title="Brio Delights API")

# Parse comma-separated or single FRONTEND_ORIGIN
raw_origins = [o.strip().rstrip("/") for o in FRONTEND_ORIGIN.split(",") if o.strip()]
default_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:3000",
]
allowed_origins = list(dict.fromkeys(raw_origins + default_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
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


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class ChatOut(BaseModel):
    response: str



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
    ingredient_id: str
    quantity: float = Field(gt=0)
    unit: str = Field(min_length=1, max_length=20)


class RecipeIngredientOut(RecipeIngredientIn):
    id: str
    name: str


class RecipeIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    category: str = Field(min_length=1, max_length=80)
    description: Optional[str] = None
    selling_price: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = None
    ingredients: List[RecipeIngredientIn] = Field(min_length=1)


class RecipeOut(BaseModel):
    id: str
    name: str
    category: str
    description: Optional[str] = None
    selling_price: Optional[float] = None
    notes: Optional[str] = None
    ingredients: List[RecipeIngredientOut]
    estimated_cost: Optional[float] = None
    created_at: str
    updated_at: str


def _auth_error(message: str, code: int = status.HTTP_400_BAD_REQUEST) -> HTTPException:
    return HTTPException(status_code=code, detail=message)




def _current_user_id() -> str:
    return "a05f8c54-de06-45b1-bb9d-3230254c0d3a"


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


def _recipe_cost(ingredients: list, costs: Dict[str, float], pantry_map: Dict[str, str]) -> Optional[float]:
    total = 0.0
    matched = False
    for item in ingredients:
        name = pantry_map.get(item["ingredient_id"], item.get("name", ""))
        key = f"{name.strip().lower()}|{item['unit'].strip().lower()}"
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


def _recipe_out(row: dict, costs: Dict[str, float], pantry_map: Dict[str, str]) -> RecipeOut:
    ingredients = row.get("recipe_ingredients") or []
    return RecipeOut(
        id=row["id"],
        name=row["name"],
        category=row.get("category", "Other"),
        description=row.get("description"),
        selling_price=None if row.get("selling_price") is None else float(row["selling_price"]),
        notes=row.get("notes"),
        ingredients=[
            RecipeIngredientOut(
                id=item["id"],
                ingredient_id=item["ingredient_id"],
                name=pantry_map.get(item["ingredient_id"], item.get("name", "Unknown")),
                quantity=float(item["quantity"]),
                unit=item["unit"],
            )
            for item in ingredients
        ],
        estimated_cost=_recipe_cost(ingredients, costs, pantry_map),
        created_at=row.get("created_at", ""),
        updated_at=row.get("updated_at", ""),
    )


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Brio Delights API",
        "health": "/health",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"ok": True, "status": "healthy"}





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
            .select("id, name, category, description, selling_price, notes, created_at, updated_at, recipe_ingredients(id, ingredient_id, quantity, unit)")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        costs = _unit_costs(sb, user_id)
        pantry_res = sb.table("pantry_items").select("id, name").eq("user_id", user_id).execute()
        pantry_map = {row["id"]: row["name"] for row in (pantry_res.data or [])}
    except Exception as exc:
        raise _missing_table_error(exc, "recipes")
    return [_recipe_out(row, costs, pantry_map) for row in (result.data or [])]

@app.get("/recipes/{recipe_id}", response_model=RecipeOut)
def get_recipe(recipe_id: str, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        result = (
            sb.table("recipes")
            .select("id, name, category, description, selling_price, notes, created_at, updated_at, recipe_ingredients(id, ingredient_id, quantity, unit)")
            .eq("id", recipe_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        if not result.data:
            raise _auth_error("Recipe not found", 404)
        costs = _unit_costs(sb, user_id)
        pantry_res = sb.table("pantry_items").select("id, name").eq("user_id", user_id).execute()
        pantry_map = {row["id"]: row["name"] for row in (pantry_res.data or [])}
    except HTTPException:
        raise
    except Exception as exc:
        raise _missing_table_error(exc, "recipes")
    return _recipe_out(result.data, costs, pantry_map)

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
                    "category": body.category.strip(),
                    "description": body.description,
                    "selling_price": body.selling_price,
                    "notes": body.notes,
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
                        "ingredient_id": item.ingredient_id,
                        "quantity": item.quantity,
                        "unit": item.unit.strip(),
                    }
                    for item in body.ingredients
                ]
            )
            .execute()
        )
        
        result = (
            sb.table("recipes")
            .select("id, name, category, description, selling_price, notes, created_at, updated_at, recipe_ingredients(id, ingredient_id, quantity, unit)")
            .eq("id", recipe_id)
            .execute()
        )
        costs = _unit_costs(sb, user_id)
        pantry_res = sb.table("pantry_items").select("id, name").eq("user_id", user_id).execute()
        pantry_map = {row["id"]: row["name"] for row in (pantry_res.data or [])}
    except HTTPException:
        raise
    except Exception as exc:
        raise _missing_table_error(exc, "recipes")
    return _recipe_out(result.data[0], costs, pantry_map)

@app.put("/recipes/{recipe_id}", response_model=RecipeOut)
def update_recipe(recipe_id: str, body: RecipeIn, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        updated = sb.table("recipes").update({
            "name": body.name.strip(),
            "category": body.category.strip(),
            "description": body.description,
            "selling_price": body.selling_price,
            "notes": body.notes,
        }).eq("id", recipe_id).eq("user_id", user_id).execute()
        
        if not updated.data:
            raise _auth_error("Could not find recipe.")
            
        sb.table("recipe_ingredients").delete().eq("recipe_id", recipe_id).execute()
        
        ingredients = sb.table("recipe_ingredients").insert([
            {
                "recipe_id": recipe_id,
                "ingredient_id": item.ingredient_id,
                "quantity": item.quantity,
                "unit": item.unit.strip(),
            }
            for item in body.ingredients
        ]).execute()
        
        result = (
            sb.table("recipes")
            .select("id, name, category, description, selling_price, notes, created_at, updated_at, recipe_ingredients(id, ingredient_id, quantity, unit)")
            .eq("id", recipe_id)
            .execute()
        )
        costs = _unit_costs(sb, user_id)
        pantry_res = sb.table("pantry_items").select("id, name").eq("user_id", user_id).execute()
        pantry_map = {row["id"]: row["name"] for row in (pantry_res.data or [])}
    except HTTPException:
        raise
    except Exception as exc:
        raise _missing_table_error(exc, "recipes")
    return _recipe_out(result.data[0], costs, pantry_map)


@app.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: str, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        sb.table("recipes").delete().eq("id", recipe_id).eq("user_id", user_id).execute()
    except Exception as exc:
        raise _missing_table_error(exc, "recipes")
    return {"ok": True}


@app.get("/recipes/{recipe_id}/ingredients", response_model=List[RecipeIngredientOut])
def list_recipe_ingredients(recipe_id: str, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        # First verify the recipe belongs to the user
        recipe_res = sb.table("recipes").select("id").eq("id", recipe_id).eq("user_id", user_id).maybe_single().execute()
        if not recipe_res.data:
            raise _auth_error("Recipe not found.", 404)
            
        result = (
            sb.table("recipe_ingredients")
            .select("id, ingredient_id, quantity, unit")
            .eq("recipe_id", recipe_id)
            .execute()
        )
        
        pantry_res = sb.table("pantry_items").select("id, name").eq("user_id", user_id).execute()
        pantry_map = {row["id"]: row["name"] for row in (pantry_res.data or [])}
    except HTTPException:
        raise
    except Exception as exc:
        raise _missing_table_error(exc, "recipe_ingredients")
        
    return [
        RecipeIngredientOut(
            id=item["id"],
            ingredient_id=item["ingredient_id"],
            name=pantry_map.get(item["ingredient_id"], "Unknown"),
            quantity=float(item["quantity"]),
            unit=item["unit"],
        )
        for item in (result.data or [])
    ]


@app.post("/recipes/{recipe_id}/ingredients", response_model=RecipeIngredientOut)
def add_recipe_ingredient(recipe_id: str, body: RecipeIngredientIn, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        recipe_res = sb.table("recipes").select("id").eq("id", recipe_id).eq("user_id", user_id).maybe_single().execute()
        if not recipe_res.data:
            raise _auth_error("Recipe not found.", 404)
            
        inserted = sb.table("recipe_ingredients").insert({
            "recipe_id": recipe_id,
            "ingredient_id": body.ingredient_id,
            "quantity": body.quantity,
            "unit": body.unit.strip(),
        }).execute()
        
        rows = inserted.data or []
        if not rows:
            raise _auth_error("Could not save recipe ingredient.")
            
        # Fetch it back with the pantry item name
        result = (
            sb.table("recipe_ingredients")
            .select("id, ingredient_id, quantity, unit")
            .eq("id", rows[0]["id"])
            .execute()
        )
        item = result.data[0]
        pantry_res = sb.table("pantry_items").select("id, name").eq("id", item["ingredient_id"]).maybe_single().execute()
        pantry_name = pantry_res.data["name"] if pantry_res.data else "Unknown"
    except HTTPException:
        raise
    except Exception as exc:
        raise _missing_table_error(exc, "recipe_ingredients")
        
    return RecipeIngredientOut(
        id=item["id"],
        ingredient_id=item["ingredient_id"],
        name=pantry_name,
        quantity=float(item["quantity"]),
        unit=item["unit"],
    )


@app.put("/recipes/{recipe_id}/ingredients/{recipe_ingredient_id}", response_model=RecipeIngredientOut)
def update_recipe_ingredient(recipe_id: str, recipe_ingredient_id: str, body: RecipeIngredientIn, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        recipe_res = sb.table("recipes").select("id").eq("id", recipe_id).eq("user_id", user_id).maybe_single().execute()
        if not recipe_res.data:
            raise _auth_error("Recipe not found.", 404)
            
        updated = sb.table("recipe_ingredients").update({
            "ingredient_id": body.ingredient_id,
            "quantity": body.quantity,
            "unit": body.unit.strip(),
        }).eq("id", recipe_ingredient_id).eq("recipe_id", recipe_id).execute()
        
        rows = updated.data or []
        if not rows:
            raise _auth_error("Could not find recipe ingredient.")
            
        # Fetch it back with the pantry item name
        result = (
            sb.table("recipe_ingredients")
            .select("id, ingredient_id, quantity, unit")
            .eq("id", recipe_ingredient_id)
            .execute()
        )
        item = result.data[0]
        pantry_res = sb.table("pantry_items").select("id, name").eq("id", item["ingredient_id"]).maybe_single().execute()
        pantry_name = pantry_res.data["name"] if pantry_res.data else "Unknown"
    except HTTPException:
        raise
    except Exception as exc:
        raise _missing_table_error(exc, "recipe_ingredients")
        
    return RecipeIngredientOut(
        id=item["id"],
        ingredient_id=item["ingredient_id"],
        name=pantry_name,
        quantity=float(item["quantity"]),
        unit=item["unit"],
    )


@app.delete("/recipes/{recipe_id}/ingredients/{recipe_ingredient_id}")
def delete_recipe_ingredient(recipe_id: str, recipe_ingredient_id: str, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        recipe_res = sb.table("recipes").select("id").eq("id", recipe_id).eq("user_id", user_id).maybe_single().execute()
        if not recipe_res.data:
            raise _auth_error("Recipe not found.", 404)
            
        sb.table("recipe_ingredients").delete().eq("id", recipe_ingredient_id).eq("recipe_id", recipe_id).execute()
    except HTTPException:
        raise
    except Exception as exc:
        raise _missing_table_error(exc, "recipe_ingredients")
        
    return {"ok": True}


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
            "purchase_date": body.purchase_date.isoformat() if body.purchase_date else date.today().isoformat(),
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
            "purchase_date": body.purchase_date.isoformat() if body.purchase_date else date.today().isoformat(),
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


# -----------------------------------------------------------------------------
# ORDERS MODULE
# -----------------------------------------------------------------------------

class OrderIn(BaseModel):
    customer_name: str = Field(min_length=1, max_length=100)
    customer_phone: Optional[str] = None
    product_type: str = Field(min_length=1, max_length=50)
    product_name: str = Field(min_length=1, max_length=100)
    flavour: Optional[str] = None
    quantity: str = Field(min_length=1, max_length=50)
    price: float = Field(ge=0)
    order_date: date
    delivery_date: Optional[date] = None
    status: str = Field(default="Completed")
    payment_status: str = Field(default="Paid")
    advance_amount: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = None

class OrderOut(OrderIn):
    id: str
    created_at: str
    updated_at: str

def _order_out(row: dict) -> OrderOut:
    return OrderOut(
        id=row["id"],
        customer_name=row["customer_name"],
        customer_phone=row.get("customer_phone"),
        product_type=row["product_type"],
        product_name=row["product_name"],
        flavour=row.get("flavour"),
        quantity=row["quantity"],
        price=float(row["price"]),
        order_date=row["order_date"],
        delivery_date=row.get("delivery_date"),
        status=row["status"],
        payment_status=row["payment_status"],
        advance_amount=float(row["advance_amount"]) if row.get("advance_amount") is not None else None,
        notes=row.get("notes"),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )

@app.get("/orders", response_model=List[OrderOut])
def list_orders(user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        result = sb.table("orders").select("*").eq("user_id", user_id).order("order_date", desc=True).order("created_at", desc=True).execute()
        return [_order_out(row) for row in (result.data or [])]
    except Exception as exc:
        raise _missing_table_error(exc, "orders")

@app.post("/orders", response_model=OrderOut)
def add_order(body: OrderIn, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        if body.advance_amount is not None and body.advance_amount > body.price:
            raise _auth_error("Advance amount cannot be greater than the total price.")
        result = sb.table("orders").insert({
            "user_id": user_id,
            "customer_name": body.customer_name.strip(),
            "customer_phone": body.customer_phone.strip() if body.customer_phone else None,
            "product_type": body.product_type.strip(),
            "product_name": body.product_name.strip(),
            "flavour": body.flavour.strip() if body.flavour else None,
            "quantity": body.quantity.strip(),
            "price": body.price,
            "order_date": body.order_date.isoformat(),
            "delivery_date": body.delivery_date.isoformat() if body.delivery_date else None,
            "status": body.status,
            "payment_status": body.payment_status,
            "advance_amount": body.advance_amount,
            "notes": body.notes.strip() if body.notes else None
        }).execute()
        rows = result.data or []
        if not rows:
            raise _auth_error("Could not save that order.")
        return _order_out(rows[0])
    except HTTPException:
        raise
    except Exception as exc:
        raise _missing_table_error(exc, "orders")

@app.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: str, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        result = sb.table("orders").select("*").eq("id", order_id).eq("user_id", user_id).maybe_single().execute()
        if not result.data:
            raise _auth_error("Order not found.", 404)
        return _order_out(result.data)
    except HTTPException:
        raise
    except Exception as exc:
        raise _missing_table_error(exc, "orders")

@app.put("/orders/{order_id}", response_model=OrderOut)
def update_order(order_id: str, body: OrderIn, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        if body.advance_amount is not None and body.advance_amount > body.price:
            raise _auth_error("Advance amount cannot be greater than the total price.")
        result = sb.table("orders").update({
            "customer_name": body.customer_name.strip(),
            "customer_phone": body.customer_phone.strip() if body.customer_phone else None,
            "product_type": body.product_type.strip(),
            "product_name": body.product_name.strip(),
            "flavour": body.flavour.strip() if body.flavour else None,
            "quantity": body.quantity.strip(),
            "price": body.price,
            "order_date": body.order_date.isoformat(),
            "delivery_date": body.delivery_date.isoformat() if body.delivery_date else None,
            "status": body.status,
            "payment_status": body.payment_status,
            "advance_amount": body.advance_amount,
            "notes": body.notes.strip() if body.notes else None,
            "updated_at": "now()"
        }).eq("id", order_id).eq("user_id", user_id).execute()
        rows = result.data or []
        if not rows:
            raise _auth_error("Order not found or could not update.")
        return _order_out(rows[0])
    except HTTPException:
        raise
    except Exception as exc:
        raise _missing_table_error(exc, "orders")

@app.delete("/orders/{order_id}")
def delete_order(order_id: str, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        sb.table("orders").delete().eq("id", order_id).eq("user_id", user_id).execute()
    except Exception as exc:
        raise _missing_table_error(exc, "orders")
    return {"ok": True}

# -----------------------------------------------------------------------------
# AI CHAT MODULE
# -----------------------------------------------------------------------------

@app.post("/ai/chat", response_model=ChatOut)
async def chat_with_ai(body: ChatIn, user_id: str = Depends(_current_user_id)):
    sb = get_supabase()
    try:
        # Fetch basic context for the user
        user_result = sb.table("profiles").select("display_name, bakery_name").eq("id", user_id).maybe_single().execute()
        user_data = user_result.data or {}
        bakery_name = user_data.get("bakery_name", "your bakery")
        display_name = user_data.get("display_name", "user")

        context = f"User Name: {display_name}. Bakery Name: {bakery_name}."

        response_text = await get_ai_response(body.message, context)
        return ChatOut(response=response_text)
    except HTTPException:
        raise
    except Exception as exc:
        raise _auth_error(f"Failed to get AI response: {exc}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

