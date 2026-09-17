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
  ingredient_id: string;
  name?: string;
  quantity: number;
  unit: string;
};

export type Recipe = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  selling_price: number | null;
  notes: string | null;
  ingredients: RecipeIngredient[];
  estimated_cost: number | null;
  created_at: string;
  updated_at: string;
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

export function getRecipe(id: string) {
  return request<Recipe>(`/recipes/${id}`);
}

export function addRecipe(body: {
  name: string;
  category: string;
  description: string | null;
  selling_price: number | null;
  notes: string | null;
  ingredients: RecipeIngredient[];
}) {
  return request<Recipe>("/recipes", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateRecipe(id: string, body: {
  name: string;
  category: string;
  description: string | null;
  selling_price: number | null;
  notes: string | null;
  ingredients: RecipeIngredient[];
}) {
  return request<Recipe>(`/recipes/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteRecipe(id: string) {
  return request<{ ok: boolean }>(`/recipes/${id}`, { method: "DELETE" });
}

export function listRecipeIngredients(recipeId: string) {
  return request<RecipeIngredient[]>(`/recipes/${recipeId}/ingredients`);
}

export function addRecipeIngredient(recipeId: string, body: { ingredient_id: string; quantity: number; unit: string }) {
  return request<RecipeIngredient>(`/recipes/${recipeId}/ingredients`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateRecipeIngredient(recipeId: string, ingredientId: string, body: { ingredient_id: string; quantity: number; unit: string }) {
  return request<RecipeIngredient>(`/recipes/${recipeId}/ingredients/${ingredientId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteRecipeIngredient(recipeId: string, ingredientId: string) {
  return request<{ ok: boolean }>(`/recipes/${recipeId}/ingredients/${ingredientId}`, { method: "DELETE" });
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

// -----------------------------------------------------------------------------
// ORDERS MODULE
// -----------------------------------------------------------------------------

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  product_type: string;
  product_name: string;
  flavour: string | null;
  quantity: string;
  price: number;
  order_date: string;
  delivery_date: string | null;
  status: string;
  payment_status: string;
  advance_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function listOrders() {
  return request<Order[]>("/orders");
}

export function addOrder(body: Omit<Order, "id" | "created_at" | "updated_at">) {
  return request<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateOrder(id: string, body: Omit<Order, "id" | "created_at" | "updated_at">) {
  return request<Order>(`/orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteOrder(id: string) {
  return request<{ ok: boolean }>(`/orders/${id}`, { method: "DELETE" });
}

// -----------------------------------------------------------------------------
// AI MODULE
// -----------------------------------------------------------------------------

export function askAI(message: string) {
  return request<{ response: string }>("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}
