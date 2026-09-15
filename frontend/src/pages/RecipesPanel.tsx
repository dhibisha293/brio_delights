import { FormEvent, useEffect, useState } from "react";
import { addRecipe, deleteRecipe, listRecipes, type Recipe } from "../api";

const UNITS = ["g", "kg", "ml", "L", "pcs", "box"];

function rupees(value: number) {
  return `₹${value.toFixed(2)}`;
}

type DraftIngredient = { name: string; quantity: string; unit: string };

const emptyIngredient = (): DraftIngredient => ({ name: "", quantity: "1", unit: "g" });

export default function RecipesPanel() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [name, setName] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([emptyIngredient()]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setRecipes(await listRecipes());
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof Error ? err.message : "Could not load recipes."));
  }, []);

  function updateIngredient(index: number, patch: Partial<DraftIngredient>) {
    setIngredients((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await addRecipe({
        name,
        selling_price: sellingPrice === "" ? null : Number(sellingPrice),
        ingredients: ingredients.map((item) => ({
          name: item.name,
          quantity: Number(item.quantity),
          unit: item.unit,
        })),
      });
      setName("");
      setSellingPrice("");
      setIngredients([emptyIngredient()]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that recipe.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    setError("");
    try {
      await deleteRecipe(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete that recipe.");
    }
  }

  return (
    <div>
      <p className="text-sm text-lav-800/80">
        Save a cake and how much of each ingredient it uses. Match pantry names and units to see an estimated cost.
      </p>
      <form onSubmit={onSubmit} className="mt-4 space-y-4 rounded-3xl bg-white/80 p-5 ring-1 ring-lav-200">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-lav-900">
            Recipe name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Chocolate cake"
              className="mt-1 w-full rounded-2xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none ring-lav-400 focus:ring-2"
            />
          </label>
          <label className="text-sm font-medium text-lav-900">
            Selling price (₹, optional)
            <input
              type="number"
              min="0"
              step="0.01"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none ring-lav-400 focus:ring-2"
            />
          </label>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-lav-900">Ingredients</p>
          {ingredients.map((item, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-8">
              <input
                required
                value={item.name}
                onChange={(e) => updateIngredient(index, { name: e.target.value })}
                placeholder="Flour"
                className="rounded-2xl border border-lav-200 bg-lav-50 px-3 py-2 sm:col-span-4"
              />
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={item.quantity}
                onChange={(e) => updateIngredient(index, { quantity: e.target.value })}
                className="rounded-2xl border border-lav-200 bg-lav-50 px-3 py-2 sm:col-span-2"
              />
              <select
                value={item.unit}
                onChange={(e) => updateIngredient(index, { unit: e.target.value })}
                className="rounded-2xl border border-lav-200 bg-lav-50 px-3 py-2 sm:col-span-1"
              >
                {UNITS.map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={ingredients.length === 1}
                onClick={() => setIngredients((current) => current.filter((_, i) => i !== index))}
                className="text-sm font-semibold text-lav-700 hover:underline disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setIngredients((current) => [...current, emptyIngredient()])}
            className="text-sm font-semibold text-lav-700 hover:underline"
          >
            + Add ingredient
          </button>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-lav-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-lav-700 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save recipe"}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
      <ul className="mt-6 space-y-3">
        {recipes.length === 0 ? (
          <li className="rounded-3xl bg-white/60 px-5 py-6 text-sm text-lav-800/80 ring-1 ring-lav-200">No recipes yet. Add your first cake above.</li>
        ) : (
          recipes.map((recipe) => (
            <li key={recipe.id} className="rounded-3xl bg-white/80 px-5 py-4 ring-1 ring-lav-200">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-lav-900">{recipe.name}</p>
                  <p className="mt-1 text-sm text-lav-800/80">
                    {recipe.estimated_cost == null ? "Add matching pantry items to see cost" : `Est. cost ${rupees(recipe.estimated_cost)}`}
                    {recipe.selling_price != null ? ` · Sells for ${rupees(recipe.selling_price)}` : ""}
                  </p>
                  <ul className="mt-2 text-sm text-lav-800/80">
                    {recipe.ingredients.map((item) => (
                      <li key={`${item.name}-${item.unit}-${item.quantity}`}>
                        {item.quantity} {item.unit} {item.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <button type="button" onClick={() => onDelete(recipe.id)} className="text-sm font-semibold text-lav-700 hover:underline">
                  Remove
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
