import { useEffect, useState } from "react";
import { Plus, Trash2, Package } from "lucide-react";
import {
  listPantry,
  addPantry,
  deletePantry,
  type PantryItem,
} from "../api";

const UNITS = ["kg", "g", "litre", "ml", "piece", "packet", "box"];

function rupees(value: number) {
  return `₹${value.toFixed(2)}`;
}

export default function PantryPanel() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PantryItem | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const data = await listPantry();
      setItems(data);
    } catch (err) {
      setError("Failed to load pantry items.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDeleteConfirm(id: string) {
    try {
      await deletePantry(id);
      await loadData();
    } catch {
      alert("Failed to delete item.");
    } finally {
      setItemToDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lav-100">
            <Package className="h-6 w-6 text-lav-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-lav-600">Total Items</p>
            <p className="text-2xl font-bold text-lav-900">{items.length}</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-2 rounded-full bg-lav-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-lav-700"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {error && <p className="text-red-500 font-medium">{error}</p>}

      {/* Item List */}
      <div className="overflow-hidden rounded-2xl border border-lav-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-lav-900">
            <thead className="border-b border-lav-200 bg-lav-50/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Ingredient</th>
                <th className="px-6 py-4 font-semibold">Quantity</th>
                <th className="px-6 py-4 font-semibold">Total Cost</th>
                <th className="px-6 py-4 font-semibold">Purchased On</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lav-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-lav-500">Loading...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-lav-500">No items found. Add your first ingredient!</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-lav-50/30">
                    <td className="px-6 py-4 font-medium text-lg">{item.name}</td>
                    <td className="px-6 py-4 font-medium text-lav-700">
                      <span className="rounded-full bg-lav-100 px-3 py-1 font-semibold">
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-green-700">{rupees(item.cost)}</td>
                    <td className="px-6 py-4 text-lav-600">{item.purchased_at}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddForm && (
        <AddPantryModal
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            loadData();
          }}
        />
      )}

      {itemToDelete && (
        <ModalOverlay onClose={() => setItemToDelete(null)}>
          <h2 className="mb-2 text-xl font-bold text-lav-900">Delete Item</h2>
          <p className="mb-6 text-sm text-lav-700">
            Are you sure you want to delete <strong>{itemToDelete.name}</strong>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setItemToDelete(null)}
              className="rounded-full bg-lav-100 px-5 py-2.5 text-sm font-semibold text-lav-700 hover:bg-lav-200"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeleteConfirm(itemToDelete.id)}
              className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
            >
              Yes, delete
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// MODALS
// -----------------------------------------------------------------------------

function ModalOverlay({ children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-lav-900/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-xl ring-1 ring-lav-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-lav-400 transition-colors hover:bg-lav-50 hover:text-lav-600"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

function AddPantryModal({ onClose, onSuccess }: any) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState(UNITS[0]);
  const [cost, setCost] = useState("");
  const [purchasedAt, setPurchasedAt] = useState(new Date().toISOString().slice(0, 10));
  
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await addPantry({
        name,
        quantity: Number(quantity),
        unit,
        cost: Number(cost),
        purchased_at: purchasedAt,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to add item.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="mb-6 text-xl font-bold text-lav-900">Add Item to Pantry</h2>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="text-sm font-medium text-lav-900">
          Ingredient Name
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Flour" className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
        </label>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-lav-900">
            Quantity
            <input type="number" min="0.01" step="0.01" required value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
          </label>
          <label className="text-sm font-medium text-lav-900">
            Unit
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400">
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-lav-900">
            Total Cost (₹)
            <input type="number" min="0" step="0.01" required value={cost} onChange={(e) => setCost(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
          </label>
          <label className="text-sm font-medium text-lav-900">
            Purchase Date
            <input type="date" required value={purchasedAt} onChange={(e) => setPurchasedAt(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
          </label>
        </div>
        
        {error && <p className="text-sm text-red-500">{error}</p>}
        
        <button type="submit" disabled={busy} className="mt-6 rounded-full bg-lav-600 py-3 font-semibold text-white transition-colors hover:bg-lav-700 disabled:opacity-60">
          {busy ? "Saving..." : "Add to Pantry"}
        </button>
      </form>
    </ModalOverlay>
  );
}
