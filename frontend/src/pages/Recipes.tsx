import RecipesPanel from "./RecipesPanel";

export default function Recipes() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-lav-900">Recipes</h1>
        <p className="mt-2 text-lav-700">Manage your recipes and calculate their costs.</p>
      </div>

      <RecipesPanel />
    </div>
  );
}
