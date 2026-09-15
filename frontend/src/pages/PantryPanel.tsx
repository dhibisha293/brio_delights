import { useEffect, useState } from "react";
import { Search, Plus, Package, AlertTriangle, Clock, AlertOctagon, History, Edit, Trash2, ShoppingBag, ArrowDownRight } from "lucide-react";
import {
  listIngredients,
  addIngredient,
  updateIngredient,
  deleteIngredient,
  listPurchases,
  addPurchase,
  updatePurchase,
  consumeIngredient,
  type Ingredient,
  type IngredientPurchase,
} from "../api";

const CATEGORIES = ["Flour", "Sugar", "Dairy", "Chocolate", "Fruits", "Nuts", "Decorations", "Packaging", "Other"];
const UNITS = ["kg", "g", "litre", "ml", "piece", "packet", "box"];

export default function PantryPanel() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals / Forms state
  const [showIngredientForm, setShowIngredientForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  
  const [showPurchaseForm, setShowPurchaseForm] = useState<Ingredient | null>(null);
  const [showHistory, setShowHistory] = useState<Ingredient | null>(null);
  const [historyData, setHistoryData] = useState<IngredientPurchase[]>([]);
  
  const [showConsumeForm, setShowConsumeForm] = useState<Ingredient | null>(null);
  const [showUpdateStock, setShowUpdateStock] = useState<Ingredient | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const data = await listIngredients();
      setIngredients(data);
    } catch (err) {
      setError("Failed to load ingredients.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this ingredient? All purchase history will also be lost.")) return;
    try {
      await deleteIngredient(id);
      await loadData();
    } catch {
      alert("Failed to delete ingredient.");
    }
  }

  const filteredIngredients = ingredients.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalIngredients = ingredients.length;
  const lowStock = ingredients.filter((i) => i.current_stock < i.minimum_stock).length;
  // Expiry is complex since it belongs to purchases. For simplicity in the summary, 
  // we'll just show placeholders if we don't fetch all purchases for all items upfront.
  // The backend could provide this, but we'll show "Needs Check" for now as per simple requirements.

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Total Ingredients" value={totalIngredients} icon={Package} color="text-lav-600" bg="bg-lav-100" />
        <SummaryCard title="Low Stock" value={lowStock} icon={AlertTriangle} color="text-amber-600" bg="bg-amber-100" />
        <SummaryCard title="Expiring Soon" value="Check" icon={Clock} color="text-orange-600" bg="bg-orange-100" />
        <SummaryCard title="Expired" value="Check" icon={AlertOctagon} color="text-red-600" bg="bg-red-100" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-lav-400" />
          <input
            type="text"
            placeholder="Search ingredients or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-lav-200 bg-white/80 py-2 pl-10 pr-4 outline-none ring-lav-400 focus:ring-2"
          />
        </div>
        <button
          onClick={() => {
            setEditingIngredient(null);
            setShowIngredientForm(true);
          }}
          className="flex items-center justify-center gap-2 rounded-full bg-lav-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-lav-700"
        >
          <Plus className="h-4 w-4" />
          Add Ingredient
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {/* Ingredient List */}
      <div className="overflow-hidden rounded-2xl border border-lav-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-lav-900">
            <thead className="border-b border-lav-200 bg-lav-50/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Ingredient</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Stock</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lav-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-lav-500">Loading...</td>
                </tr>
              ) : filteredIngredients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-lav-500">No ingredients found.</td>
                </tr>
              ) : (
                filteredIngredients.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-lav-50/30">
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-lav-100 px-2.5 py-1 text-xs font-medium text-lav-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {item.has_unknown_stock ? (
                        <span className="text-amber-600 font-semibold">
                          {item.current_stock > 0 ? `${item.current_stock} ${item.unit} + Unknown` : "Unknown"}
                        </span>
                      ) : (
                        `${item.current_stock} ${item.unit}`
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.has_unknown_stock ? (
                        <span className="flex w-max items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                          <AlertTriangle className="h-3 w-3" />
                          Quantity Unknown
                        </span>
                      ) : item.current_stock < item.minimum_stock ? (
                        <span className="flex w-max items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                          <AlertTriangle className="h-3 w-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="flex w-max items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.has_unknown_stock && (
                          <button
                            onClick={() => setShowUpdateStock(item)}
                            className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-200"
                            title="Update Opening Stock"
                          >
                            Update Stock
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setHistoryData([]);
                            setShowHistory(item);
                            listPurchases(item.id).then(setHistoryData);
                          }}
                          className="rounded-lg p-2 text-lav-500 transition-colors hover:bg-lav-100 hover:text-lav-700"
                          title="View History"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowConsumeForm(item)}
                          className="rounded-lg p-2 text-orange-500 transition-colors hover:bg-orange-100 hover:text-orange-700"
                          title="Consume (FIFO)"
                        >
                          <ArrowDownRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowPurchaseForm(item)}
                          className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-100 hover:text-green-700"
                          title="Add Purchase"
                        >
                          <ShoppingBag className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingIngredient(item);
                            setShowIngredientForm(true);
                          }}
                          className="rounded-lg p-2 text-lav-500 transition-colors hover:bg-lav-100 hover:text-lav-700"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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

      {/* Modals */}
      {showIngredientForm && (
        <IngredientModal
          existing={editingIngredient}
          onClose={() => setShowIngredientForm(false)}
          onSuccess={() => {
            setShowIngredientForm(false);
            loadData();
          }}
        />
      )}

      {showPurchaseForm && (
        <PurchaseModal
          ingredient={showPurchaseForm}
          onClose={() => setShowPurchaseForm(null)}
          onSuccess={() => {
            setShowPurchaseForm(null);
            loadData();
          }}
        />
      )}

      {showHistory && (
        <HistoryModal
          ingredient={showHistory}
          history={historyData}
          onClose={() => setShowHistory(null)}
        />
      )}

      {showConsumeForm && (
        <ConsumeModal
          ingredient={showConsumeForm}
          onClose={() => setShowConsumeForm(null)}
          onSuccess={() => {
            setShowConsumeForm(null);
            loadData();
          }}
        />
      )}

      {showUpdateStock && (
        <UpdateStockModal
          ingredient={showUpdateStock}
          onClose={() => setShowUpdateStock(null)}
          onSuccess={() => {
            setShowUpdateStock(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-lav-200/50">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${bg}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-lav-600">{title}</p>
        <p className="text-2xl font-bold text-lav-900">{value}</p>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// MODALS
// -----------------------------------------------------------------------------

function ModalOverlay({ children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-lav-900/40 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl ring-1 ring-lav-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-lav-400 hover:text-lav-600"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

function IngredientModal({ existing, onClose, onSuccess }: any) {
  const [name, setName] = useState(existing?.name || "");
  const [category, setCategory] = useState(existing?.category || CATEGORIES[0]);
  const [unit, setUnit] = useState(existing?.unit || UNITS[0]);
  const [minimumStock, setMinimumStock] = useState(existing?.minimum_stock || "0");
  const [notes, setNotes] = useState(existing?.notes || "");
  
  // Opening Stock State
  const [hasIngredient, setHasIngredient] = useState(false);
  const [knowQuantity, setKnowQuantity] = useState(false);
  const [purchaseQty, setPurchaseQty] = useState("");
  const [knowCost, setKnowCost] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState("");
  
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = {
        name,
        category,
        unit,
        minimum_stock: Number(minimumStock),
        notes,
      };
      if (existing) {
        await updateIngredient(existing.id, payload);
      } else {
        const created = await addIngredient(payload);
        if (hasIngredient) {
          await addPurchase(created.id, {
            shop_name: null,
            purchase_date: null,
            quantity: knowQuantity ? Number(purchaseQty) : null,
            price: knowCost ? Number(purchasePrice) : null,
            expiry_date: null,
            notes: "Opening Stock",
            is_opening_stock: true,
          });
        }
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="mb-6 text-xl font-bold text-lav-900">{existing ? "Edit Ingredient" : "Add Ingredient"}</h2>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="text-sm font-medium text-lav-900">
          Name
          <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-lav-900">
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-lav-900">
            Unit
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400">
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </label>
        </div>
        <label className="text-sm font-medium text-lav-900">
          Minimum Stock
          <input type="number" min="0" step="0.01" required value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
        </label>
        <label className="text-sm font-medium text-lav-900">
          Notes
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
        </label>
        
        {!existing && (
          <div className="rounded-xl border border-lav-200 bg-lav-50/50 p-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-lav-900">
              <input type="checkbox" checked={hasIngredient} onChange={(e) => setHasIngredient(e.target.checked)} className="h-4 w-4 rounded border-lav-300 text-lav-600 focus:ring-lav-600" />
              Do you already have this ingredient?
            </label>
            {hasIngredient && (
              <div className="mt-4 grid gap-4">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-lav-900">
                    <input type="checkbox" checked={knowQuantity} onChange={(e) => setKnowQuantity(e.target.checked)} className="h-4 w-4 rounded border-lav-300 text-lav-600 focus:ring-lav-600" />
                    Do you know the current quantity?
                  </label>
                  {knowQuantity && (
                    <label className="text-sm font-medium text-lav-900 pl-6">
                      Current Quantity ({unit})
                      <input type="number" min="0.01" step="0.01" required={knowQuantity} value={purchaseQty} onChange={(e) => setPurchaseQty(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
                    </label>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-lav-900">
                    <input type="checkbox" checked={knowCost} onChange={(e) => setKnowCost(e.target.checked)} className="h-4 w-4 rounded border-lav-300 text-lav-600 focus:ring-lav-600" />
                    Do you know the approximate cost?
                  </label>
                  {knowCost && (
                    <label className="text-sm font-medium text-lav-900 pl-6">
                      Approximate Cost (₹)
                      <input type="number" min="0" step="0.01" required={knowCost} value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={busy} className="mt-4 rounded-full bg-lav-600 py-2.5 font-semibold text-white hover:bg-lav-700 disabled:opacity-60">
          {busy ? "Saving..." : "Save Ingredient"}
        </button>
      </form>
    </ModalOverlay>
  );
}

function PurchaseModal({ ingredient, onClose, onSuccess }: any) {
  const [shopName, setShopName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await addPurchase(ingredient.id, {
        shop_name: shopName,
        purchase_date: purchaseDate,
        quantity: Number(quantity),
        price: Number(price),
        expiry_date: expiryDate || null,
        notes,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save purchase.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="mb-6 text-xl font-bold text-lav-900">Add Purchase for {ingredient.name}</h2>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="text-sm font-medium text-lav-900">
          Shop Name
          <input required value={shopName} onChange={(e) => setShopName(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-lav-900">
            Quantity ({ingredient.unit})
            <input type="number" min="0.01" step="0.01" required value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
          </label>
          <label className="text-sm font-medium text-lav-900">
            Price (₹)
            <input type="number" min="0" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-lav-900">
            Purchase Date
            <input type="date" required value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
          </label>
          <label className="text-sm font-medium text-lav-900">
            Expiry Date (optional)
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
          </label>
        </div>
        <label className="text-sm font-medium text-lav-900">
          Notes
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={busy} className="mt-4 rounded-full bg-lav-600 py-2.5 font-semibold text-white hover:bg-lav-700 disabled:opacity-60">
          {busy ? "Saving..." : "Add Purchase"}
        </button>
      </form>
    </ModalOverlay>
  );
}

function HistoryModal({ ingredient, history, onClose }: any) {
  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="mb-2 text-xl font-bold text-lav-900">{ingredient.name} — Purchase History</h2>
      <p className="mb-6 text-sm text-lav-700">Total Stock: {ingredient.current_stock} {ingredient.unit}</p>
      
      <div className="max-h-[50vh] overflow-y-auto">
        {history.length === 0 ? (
          <p className="text-sm text-lav-500">No purchase history found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-lav-200">
              <tr>
                <th className="pb-2 font-semibold">Date</th>
                <th className="pb-2 font-semibold">Shop</th>
                <th className="pb-2 font-semibold">Qty</th>
                <th className="pb-2 font-semibold">Price</th>
                <th className="pb-2 text-right font-semibold">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lav-100">
              {history.map((h: any) => (
                <tr key={h.id} className={h.remaining_quantity === 0 ? "opacity-50" : ""}>
                  <td className="py-2">{h.purchase_date}</td>
                  <td className="py-2">{h.shop_name}</td>
                  <td className="py-2">{h.quantity} {ingredient.unit}</td>
                  <td className="py-2">₹{h.price}</td>
                  <td className="py-2 text-right font-medium">{h.remaining_quantity} {ingredient.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ModalOverlay>
  );
}

function ConsumeModal({ ingredient, onClose, onSuccess }: any) {
  const [quantity, setQuantity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await consumeIngredient(ingredient.id, Number(quantity));
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to consume.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="mb-2 text-xl font-bold text-lav-900">Consume {ingredient.name} (FIFO)</h2>
      <p className="mb-6 text-sm text-lav-700">Current Stock: {ingredient.current_stock} {ingredient.unit}</p>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="text-sm font-medium text-lav-900">
          Quantity to Consume ({ingredient.unit})
          <input type="number" min="0.01" step="0.01" max={ingredient.current_stock} required value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
        </label>
        <p className="text-xs text-lav-500">This will permanently deduct from your oldest available purchase batches automatically.</p>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={busy || ingredient.current_stock <= 0} className="mt-4 rounded-full bg-orange-500 py-2.5 font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
          {busy ? "Processing..." : "Consume Stock"}
        </button>
      </form>
    </ModalOverlay>
  );
}

function UpdateStockModal({ ingredient, onClose, onSuccess }: any) {
  const [purchase, setPurchase] = useState<IngredientPurchase | null>(null);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listPurchases(ingredient.id).then(data => {
      // Find the first unknown stock batch
      const target = data.find(p => p.remaining_quantity === null);
      if (target) {
        setPurchase(target);
        if (target.price !== null) setPrice(String(target.price));
      } else {
        setError("No unknown stock batch found.");
      }
      setLoading(false);
    }).catch(err => {
      setError(err.message || "Failed to load purchases.");
      setLoading(false);
    });
  }, [ingredient.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!purchase) return;
    setBusy(true);
    setError("");
    try {
      await updatePurchase(ingredient.id, purchase.id, {
        shop_name: purchase.shop_name,
        purchase_date: purchase.purchase_date,
        quantity: Number(quantity),
        price: price ? Number(price) : null,
        expiry_date: purchase.expiry_date,
        notes: purchase.notes,
        is_opening_stock: purchase.is_opening_stock,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to update stock.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="mb-2 text-xl font-bold text-lav-900">Update Stock: {ingredient.name}</h2>
      <p className="mb-6 text-sm text-lav-700">Enter the current quantity for your opening stock.</p>
      
      {loading ? (
        <p className="text-lav-500">Loading...</p>
      ) : error && !purchase ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="text-sm font-medium text-lav-900">
            Quantity ({ingredient.unit})
            <input type="number" min="0.01" step="0.01" required value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
          </label>
          <label className="text-sm font-medium text-lav-900">
            Approximate Cost (₹)
            <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={busy} className="mt-4 rounded-full bg-lav-600 py-2.5 font-semibold text-white hover:bg-lav-700 disabled:opacity-60">
            {busy ? "Saving..." : "Update Stock"}
          </button>
        </form>
      )}
    </ModalOverlay>
  );
}
