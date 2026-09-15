import PantryPanel from "./PantryPanel";

export default function Pantry() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-lav-900">Pantry</h1>
        <p className="mt-2 text-lav-700">Track and manage your ingredients inventory.</p>
      </div>

      <PantryPanel />
    </div>
  );
}
