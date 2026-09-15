import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Eye, Search, BookOpen, AlertCircle, Package } from "lucide-react";
import {
  listRecipes,
  addRecipe,
  updateRecipe,
  deleteRecipe,
  listIngredients,
  type Recipe,
  type Ingredient,
} from "../api";

const UNITS = ["g", "kg", "ml", "L", "piece", "packet", "box"];
const CATEGORIES = ["Cake", "Cupcake", "Cookie", "Puff", "Dessert", "Other"];

function rupees(value: number | null | undefined) {
  if (value == null) return "—";
  return `₹${value.toFixed(2)}`;
}

export default function RecipesPanel() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantryItems, setPantryItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [view, setView] = useState<"list" | "form" | "view">("list");
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [recipesData, pantryData] = await Promise.all([
        listRecipes(),
        listIngredients(),
      ]);
      setRecipes(recipesData);
      setPantryItems(pantryData);
    } catch (err) {
      setError("Failed to load recipes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDeleteConfirm(id: string) {
    try {
      await deleteRecipe(id);
      await loadData();
    } catch {
      alert("Failed to delete recipe.");
    } finally {
      setRecipeToDelete(null);
    }
  }

  const filteredRecipes = recipes.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
    );
  });

  if (view === "form") {
    return (
      <RecipeForm
        initialData={editingRecipe}
        pantryItems={pantryItems}
        onClose={() => {
          setView("list");
          setEditingRecipe(null);
        }}
        onSuccess={() => {
          setView("list");
          setEditingRecipe(null);
          loadData();
        }}
      />
    );
  }

  if (view === "view" && viewingRecipe) {
    return (
      <RecipeView
        recipe={viewingRecipe}
        onClose={() => setView("list")}
        onEdit={() => {
          setEditingRecipe(viewingRecipe);
          setView("form");
        }}
        onDelete={() => setRecipeToDelete(viewingRecipe)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lav-100">
            <BookOpen className="h-6 w-6 text-lav-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-lav-600">Total Recipes</p>
            <p className="text-2xl font-bold text-lav-900">{recipes.length}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lav-400" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-lav-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition-shadow focus:border-lav-400 focus:ring-2 focus:ring-lav-400/20 sm:w-64"
            />
          </div>
          <button
            onClick={() => {
              setEditingRecipe(null);
              setView("form");
            }}
            className="flex items-center justify-center gap-2 rounded-full bg-lav-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-lav-700 shadow-sm hover:shadow"
          >
            <Plus className="h-4 w-4" />
            Add Recipe
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 font-medium">{error}</p>}

      {/* Recipe List */}
      <div className="overflow-hidden rounded-2xl border border-lav-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-lav-900">
            <thead className="border-b border-lav-200 bg-lav-50/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Recipe Name</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold text-center">Ingredients</th>
                <th className="px-6 py-4 font-semibold">Selling Price</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lav-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-lav-500">
                    <div className="flex justify-center mb-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-lav-200 border-t-lav-600"></div>
                    </div>
                    Loading recipes...
                  </td>
                </tr>
              ) : recipes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lav-50 mb-4">
                      <BookOpen className="h-8 w-8 text-lav-400" />
                    </div>
                    <h3 className="text-lg font-bold text-lav-900 mb-1">No recipes yet</h3>
                    <p className="text-lav-500 mb-6">Create your first recipe to get started.</p>
                    <button
                      onClick={() => {
                        setEditingRecipe(null);
                        setView("form");
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-lav-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-lav-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Recipe
                    </button>
                  </td>
                </tr>
              ) : filteredRecipes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-lav-500">
                    No recipes found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredRecipes.map((recipe) => (
                  <tr key={recipe.id} className="transition-colors hover:bg-lav-50/50 group">
                    <td className="px-6 py-4 font-medium text-base text-lav-900">
                      {recipe.name}
                    </td>
                    <td className="px-6 py-4 text-lav-700">
                      <span className="inline-flex items-center rounded-full bg-lav-100 px-2.5 py-0.5 text-xs font-semibold text-lav-800">
                        {recipe.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-lav-50 text-xs font-bold text-lav-700 ring-1 ring-lav-200">
                        {recipe.ingredients.length}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-green-700">
                      {rupees(recipe.selling_price)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
                        <button
                          onClick={() => setViewingRecipe(recipe)}
                          className="rounded-lg p-2 text-lav-600 transition-colors hover:bg-lav-100 hover:text-lav-900"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingRecipe(recipe);
                            setView("form");
                          }}
                          className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setRecipeToDelete(recipe)}
                          className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {recipeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-lav-900/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-xl ring-1 ring-lav-200">
            <h2 className="mb-2 text-xl font-bold text-lav-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Delete Recipe
            </h2>
            <p className="mb-6 text-sm text-lav-700">
              Are you sure you want to delete <strong>{recipeToDelete.name}</strong>? This will remove all ingredient references but will <strong>not</strong> affect your pantry stock.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setRecipeToDelete(null)}
                className="rounded-full bg-lav-50 px-5 py-2.5 text-sm font-semibold text-lav-700 hover:bg-lav-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(recipeToDelete.id)}
                className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 shadow-sm"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// RECIPE FORM COMPONENT
// -----------------------------------------------------------------------------

type DraftIngredient = { ingredient_id: string; quantity: string; unit: string };

function RecipeForm({
  initialData,
  pantryItems,
  onClose,
  onSuccess,
}: {
  initialData: Recipe | null;
  pantryItems: Ingredient[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [category, setCategory] = useState(initialData?.category || CATEGORIES[0]);
  const [description, setDescription] = useState(initialData?.description || "");
  const [sellingPrice, setSellingPrice] = useState(initialData?.selling_price?.toString() || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  
  const [ingredients, setIngredients] = useState<DraftIngredient[]>(
    initialData?.ingredients?.length
      ? initialData.ingredients.map((i) => ({
          ingredient_id: i.ingredient_id,
          quantity: i.quantity.toString(),
          unit: i.unit,
        }))
      : []
  );

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isEditing = !!initialData;

  function updateIngredient(index: number, patch: Partial<DraftIngredient>) {
    setIngredients((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function handleIngredientSelect(index: number, ingredientId: string) {
    const pantryItem = pantryItems.find((p) => p.id === ingredientId);
    if (pantryItem) {
      updateIngredient(index, { ingredient_id: ingredientId, unit: pantryItem.unit });
    } else {
      updateIngredient(index, { ingredient_id: ingredientId });
    }
  }

  function addIngredientRow() {
    setIngredients([...ingredients, { ingredient_id: "", quantity: "", unit: "g" }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validation
    if (!name.trim()) return setError("Recipe name cannot be empty.");
    if (ingredients.length === 0) return setError("Please add at least one ingredient.");
    
    // Check for duplicates
    const ids = ingredients.map(i => i.ingredient_id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      return setError("A recipe cannot contain the same ingredient multiple times.");
    }

    for (const ing of ingredients) {
      if (!ing.ingredient_id) return setError("Please select an ingredient for all rows.");
      if (Number(ing.quantity) <= 0) return setError("Quantity must be greater than 0.");
    }

    if (sellingPrice && Number(sellingPrice) < 0) {
      return setError("Selling price cannot be negative.");
    }

    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        category,
        description: description.trim() || null,
        selling_price: sellingPrice ? Number(sellingPrice) : null,
        notes: notes.trim() || null,
        ingredients: ingredients.map((item) => ({
          ingredient_id: item.ingredient_id,
          quantity: Number(item.quantity),
          unit: item.unit,
        })),
      };

      if (isEditing) {
        await updateRecipe(initialData.id, payload);
      } else {
        await addRecipe(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Could not save recipe.");
    } finally {
      setBusy(false);
    }
  }

  // Filter available ingredients for dropdown (exclude already selected ones, except for the current row)
  const getAvailablePantryItems = (currentRowIndex: number) => {
    const selectedIds = new Set(ingredients.map((ing, i) => i !== currentRowIndex ? ing.ingredient_id : null));
    return pantryItems.filter(p => !selectedIds.has(p.id));
  };

  return (
    <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-lav-900">
            {isEditing ? "Edit Recipe" : "Create New Recipe"}
          </h2>
          <p className="mt-1 text-sm text-lav-700">
            {isEditing ? "Update your recipe details." : "Add a new recipe to your collection."}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full bg-lav-50 px-4 py-2 text-sm font-semibold text-lav-700 hover:bg-lav-100"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info Card */}
        <div className="rounded-3xl border border-lav-200 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="mb-6 text-lg font-bold text-lav-900 border-b border-lav-100 pb-3">Basic Information</h3>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="text-sm font-medium text-lav-900">
              Recipe Name <span className="text-red-500">*</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Chocolate Cake"
                className="mt-1.5 w-full rounded-xl border border-lav-200 bg-lav-50/50 px-4 py-2.5 outline-none transition-colors focus:border-lav-400 focus:bg-white focus:ring-2 focus:ring-lav-400/20"
              />
            </label>

            <label className="text-sm font-medium text-lav-900">
              Category <span className="text-red-500">*</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-lav-200 bg-lav-50/50 px-4 py-2.5 outline-none transition-colors focus:border-lav-400 focus:bg-white focus:ring-2 focus:ring-lav-400/20 appearance-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-lav-900 sm:col-span-2">
              Description <span className="text-lav-400 font-normal">(Optional)</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description of this recipe..."
                rows={2}
                className="mt-1.5 w-full resize-none rounded-xl border border-lav-200 bg-lav-50/50 px-4 py-2.5 outline-none transition-colors focus:border-lav-400 focus:bg-white focus:ring-2 focus:ring-lav-400/20"
              />
            </label>

            <label className="text-sm font-medium text-lav-900">
              Selling Price (₹) <span className="text-lav-400 font-normal">(Optional)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                className="mt-1.5 w-full rounded-xl border border-lav-200 bg-lav-50/50 px-4 py-2.5 outline-none transition-colors focus:border-lav-400 focus:bg-white focus:ring-2 focus:ring-lav-400/20"
              />
            </label>

            <label className="text-sm font-medium text-lav-900">
              Notes <span className="text-lav-400 font-normal">(Optional)</span>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions..."
                className="mt-1.5 w-full rounded-xl border border-lav-200 bg-lav-50/50 px-4 py-2.5 outline-none transition-colors focus:border-lav-400 focus:bg-white focus:ring-2 focus:ring-lav-400/20"
              />
            </label>
          </div>
        </div>

        {/* Ingredients Card */}
        <div className="rounded-3xl border border-lav-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-lav-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-lav-900">Ingredients</h3>
              <p className="text-sm text-lav-500 mt-1">Select items from your pantry to build this recipe.</p>
            </div>
            <button
              type="button"
              onClick={addIngredientRow}
              className="inline-flex items-center gap-1.5 rounded-full bg-lav-100 px-3 py-1.5 text-sm font-semibold text-lav-700 transition-colors hover:bg-lav-200"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          <div className="space-y-3">
            {ingredients.length === 0 ? (
              <div className="rounded-xl border border-dashed border-lav-300 bg-lav-50 p-8 text-center">
                <p className="text-sm text-lav-600 mb-3">No ingredients added yet.</p>
                <button
                  type="button"
                  onClick={addIngredientRow}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-lav-700 shadow-sm ring-1 ring-lav-200 hover:bg-lav-50"
                >
                  Add First Ingredient
                </button>
              </div>
            ) : (
              ingredients.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center rounded-xl bg-lav-50/50 p-3 ring-1 ring-lav-200/50 transition-colors focus-within:ring-lav-300 hover:bg-lav-50">
                  <div className="w-full sm:flex-1">
                    <select
                      required
                      value={item.ingredient_id}
                      onChange={(e) => handleIngredientSelect(index, e.target.value)}
                      className="w-full rounded-lg border-none bg-white px-3 py-2 text-sm shadow-sm outline-none ring-1 ring-lav-200 focus:ring-2 focus:ring-lav-400"
                    >
                      <option value="" disabled>Select Pantry Item...</option>
                      {item.ingredient_id && !getAvailablePantryItems(index).find(p => p.id === item.ingredient_id) && (
                        // Include the currently selected item even if it's filtered out for others
                        <option value={item.ingredient_id}>
                          {pantryItems.find(p => p.id === item.ingredient_id)?.name || "Unknown Item"}
                        </option>
                      )}
                      {getAvailablePantryItems(index).map((pantryItem) => (
                        <option key={pantryItem.id} value={pantryItem.id}>
                          {pantryItem.name} ({pantryItem.current_stock} {pantryItem.unit} in stock)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex w-full sm:w-auto gap-2">
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateIngredient(index, { quantity: e.target.value })}
                      className="w-24 rounded-lg border-none bg-white px-3 py-2 text-sm shadow-sm outline-none ring-1 ring-lav-200 focus:ring-2 focus:ring-lav-400"
                    />
                    <select
                      value={item.unit}
                      onChange={(e) => updateIngredient(index, { unit: e.target.value })}
                      className="w-24 rounded-lg border-none bg-white px-3 py-2 text-sm shadow-sm outline-none ring-1 ring-lav-200 focus:ring-2 focus:ring-lav-400 appearance-none"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIngredients((current) => current.filter((_, i) => i !== index))}
                      className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg bg-white text-red-500 shadow-sm ring-1 ring-lav-200 transition-colors hover:bg-red-50 hover:text-red-700"
                      title="Remove Ingredient"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-lav-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white px-8 py-3 font-semibold text-lav-700 ring-1 ring-lav-200 hover:bg-lav-50 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-lav-600 px-8 py-3 font-semibold text-white hover:bg-lav-700 transition-all shadow-sm hover:shadow-md disabled:opacity-70 flex items-center gap-2"
          >
            {busy ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                Saving...
              </>
            ) : (
              "Save Recipe"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// -----------------------------------------------------------------------------
// RECIPE VIEW COMPONENT
// -----------------------------------------------------------------------------

function RecipeView({
  recipe,
  onClose,
  onEdit,
  onDelete,
}: {
  recipe: Recipe;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onClose}
          className="rounded-full bg-lav-50 px-4 py-2 text-sm font-semibold text-lav-700 hover:bg-lav-100 flex items-center gap-2"
        >
          ← Back to List
        </button>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 flex items-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-lav-200 bg-white shadow-sm">
        {/* Header Section */}
        <div className="bg-lav-50/50 p-8 border-b border-lav-100">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-lav-900">{recipe.name}</h2>
                <span className="rounded-full bg-lav-200/50 px-3 py-1 text-sm font-semibold text-lav-800">
                  {recipe.category}
                </span>
              </div>
              {recipe.description && (
                <p className="text-lav-700 mt-2 max-w-2xl text-lg">{recipe.description}</p>
              )}
            </div>
            {recipe.selling_price != null && (
              <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-lav-200 shrink-0 text-center min-w-[140px]">
                <p className="text-xs font-bold text-lav-500 uppercase tracking-wider mb-1">Selling Price</p>
                <p className="text-2xl font-black text-green-600">{rupees(recipe.selling_price)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 grid gap-10 md:grid-cols-3">
          
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-lav-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-lav-500" />
                Ingredients
              </h3>
              {recipe.ingredients.length === 0 ? (
                <p className="text-lav-500 italic">No ingredients specified.</p>
              ) : (
                <div className="rounded-2xl border border-lav-200 overflow-hidden bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-lav-50/80 border-b border-lav-100">
                      <tr>
                        <th className="px-5 py-3 font-semibold text-lav-900">Ingredient Name</th>
                        <th className="px-5 py-3 font-semibold text-lav-900 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lav-100">
                      {recipe.ingredients.map((ing) => (
                        <tr key={ing.id || ing.ingredient_id} className="hover:bg-lav-50/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-lav-900">{ing.name}</td>
                          <td className="px-5 py-3 text-right">
                            <span className="inline-block bg-lav-100 text-lav-800 px-2 py-1 rounded-md font-semibold text-xs">
                              {ing.quantity} {ing.unit}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {recipe.notes && (
              <div className="bg-yellow-50 rounded-2xl p-5 border border-yellow-100">
                <h4 className="font-bold text-yellow-800 mb-2 text-sm uppercase tracking-wider">Notes</h4>
                <p className="text-yellow-900/80 text-sm leading-relaxed whitespace-pre-wrap">{recipe.notes}</p>
              </div>
            )}
            
            <div className="bg-lav-50/50 rounded-2xl p-5 border border-lav-100">
              <h4 className="font-bold text-lav-800 mb-2 text-sm uppercase tracking-wider">Details</h4>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-lav-500">Created At</dt>
                  <dd className="font-medium text-lav-900">
                    {new Date(recipe.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-lav-500">Total Items</dt>
                  <dd className="font-medium text-lav-900">
                    {recipe.ingredients.length} ingredients
                  </dd>
                </div>
                {recipe.estimated_cost != null && (
                  <div className="flex justify-between border-t border-lav-200 pt-3 mt-3">
                    <dt className="font-semibold text-lav-700">Est. Cost</dt>
                    <dd className="font-bold text-red-600">
                      {rupees(recipe.estimated_cost)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
