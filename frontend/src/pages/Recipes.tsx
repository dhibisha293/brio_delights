import RecipesPanel from "./RecipesPanel";

export default function Recipes() {
  return (
    <div style={{ maxWidth: "64rem", margin: "0 auto" }} className="space-y-8">
      <div>
        <h1 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: "2rem", color: "var(--ink)", margin: 0 }}>
          Recipes
        </h1>
        <p style={{ marginTop: "0.5rem", color: "var(--muted)", fontWeight: 600 }}>
          Manage your recipes and calculate their costs.
        </p>
      </div>
      <RecipesPanel />
    </div>
  );
}
