const API_URL = import.meta.env.VITE_API_URL || "/api";

export type User = {
  id: string;
  email: string;
  display_name: string;
  bakery_name: string;
};

export type AuthResponse = {
  access_token: string;
  user: User;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 15000);
  const token = localStorage.getItem("brio_token");
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The server took too long to respond.");
    }
    throw new Error("Could not reach the server. Is the API running?");
  } finally {
    window.clearTimeout(timer);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof data.detail === "string" ? data.detail : "Something went wrong.";
    throw new Error(detail);
  }
  return data as T;
}

export function signup(body: {
  email: string;
  password: string;
  display_name: string;
  bakery_name: string;
}) {
  return request<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function login(body: { email: string; password: string }) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function me() {
  return request<User>("/auth/me");
}

export function logout() {
  return request<{ ok: boolean }>("/auth/logout", {
    method: "POST",
  });
}

export type PantryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  purchased_at: string;
};

export type RecipeIngredient = {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
};

export type Recipe = {
  id: string;
  name: string;
  selling_price: number | null;
  ingredients: RecipeIngredient[];
  estimated_cost: number | null;
};

export function listPantry() {
  return request<PantryItem[]>("/pantry");
}

export function addPantry(body: Omit<PantryItem, "id">) {
  return request<PantryItem>("/pantry", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deletePantry(id: string) {
  return request<{ ok: boolean }>(`/pantry/${id}`, { method: "DELETE" });
}

export function listRecipes() {
  return request<Recipe[]>("/recipes");
}

export function addRecipe(body: {
  name: string;
  selling_price: number | null;
  ingredients: RecipeIngredient[];
}) {
  return request<Recipe>("/recipes", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deleteRecipe(id: string) {
  return request<{ ok: boolean }>(`/recipes/${id}`, { method: "DELETE" });
}

// -----------------------------------------------------------------------------
// NEW PANTRY MODULE
// -----------------------------------------------------------------------------

export type Ingredient = {
  id: string;
  name: string;
  category: string;
  unit: string;
  minimum_stock: number;
  notes: string | null;
  created_at: string;
  current_stock: number;
  has_unknown_stock: boolean;
};

export type IngredientPurchase = {
  id: string;
  ingredient_id: string;
  shop_name: string | null;
  purchase_date: string | null;
  quantity: number | null;
  remaining_quantity: number | null;
  price: number | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
  is_opening_stock?: boolean;
};

export function listIngredients() {
  return request<Ingredient[]>("/ingredients");
}

export function addIngredient(body: Omit<Ingredient, "id" | "created_at" | "current_stock">) {
  return request<Ingredient>("/ingredients", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateIngredient(id: string, body: Omit<Ingredient, "id" | "created_at" | "current_stock">) {
  return request<Ingredient>(`/ingredients/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteIngredient(id: string) {
  return request<{ ok: boolean }>(`/ingredients/${id}`, { method: "DELETE" });
}

export function listPurchases(ingredientId: string) {
  return request<IngredientPurchase[]>(`/ingredients/${ingredientId}/purchases`);
}

export function addPurchase(ingredientId: string, body: Omit<IngredientPurchase, "id" | "ingredient_id" | "remaining_quantity" | "created_at">) {
  return request<IngredientPurchase>(`/ingredients/${ingredientId}/purchases`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updatePurchase(ingredientId: string, purchaseId: string, body: Omit<IngredientPurchase, "id" | "ingredient_id" | "remaining_quantity" | "created_at">) {
  return request<IngredientPurchase>(`/ingredients/${ingredientId}/purchases/${purchaseId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function consumeIngredient(ingredientId: string, quantity: number) {
  return request<{ ok: boolean }>(`/ingredients/${ingredientId}/consume`, {
    method: "POST",
    body: JSON.stringify({ quantity }),
  });
}
