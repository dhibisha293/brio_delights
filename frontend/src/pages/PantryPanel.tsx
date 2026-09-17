import { useEffect, useState, useMemo } from "react";
import { Plus, Package, AlertTriangle, Clock, HelpCircle, Search, MoreVertical, X, Wheat, Box, Sparkles, ChefHat } from "lucide-react";
import {
  listIngredients,
  addIngredient,
  updateIngredient,
  deleteIngredient,
  listPurchases,
  addPurchase,
  type Ingredient,
  type IngredientPurchase,
} from "../api";

const CATEGORIES = ["All Items", "Ingredients", "Packaging", "Decorations", "Bakery Supplies", "Other"];
const UNITS = ["kg", "g", "litre", "ml", "piece", "packet", "box", "metre", "roll"];
const STOCK_FILTERS = ["All", "In Stock", "Low Stock", "Out of Stock", "Quantity Unknown"];
const SORT_OPTIONS = ["Name A-Z", "Name Z-A", "Recently Added", "Low Stock First", "Expiring Soon"];

function rupees(value: number) {
  return `₹${value.toFixed(2)}`;
}

export default function PantryPanel() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Items");
  const [stockFilter, setStockFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Name A-Z");

  const [showAddModal, setShowAddModal] = useState(false);
  const [detailsItem, setDetailsItem] = useState<Ingredient | null>(null);
  const [purchaseItem, setPurchaseItem] = useState<Ingredient | null>(null);
  const [updateStockItem, setUpdateStockItem] = useState<Ingredient | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const data = await listIngredients();
      setItems(data);
    } catch (err) {
      // error handled
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(s) || i.category.toLowerCase().includes(s));
    }
    if (category !== "All Items") {
      result = result.filter(i => i.category === category);
    }
    if (stockFilter === "In Stock") {
      result = result.filter(i => !i.has_unknown_stock && i.current_stock > 0);
    } else if (stockFilter === "Low Stock") {
      result = result.filter(i => !i.has_unknown_stock && i.current_stock > 0 && i.current_stock <= i.minimum_stock);
    } else if (stockFilter === "Out of Stock") {
      result = result.filter(i => !i.has_unknown_stock && i.current_stock <= 0);
    } else if (stockFilter === "Quantity Unknown") {
      result = result.filter(i => i.has_unknown_stock);
    }

    result.sort((a, b) => {
      if (sortBy === "Name A-Z") return a.name.localeCompare(b.name);
      if (sortBy === "Name Z-A") return b.name.localeCompare(a.name);
      if (sortBy === "Recently Added") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "Low Stock First") {
        const aLow = (!a.has_unknown_stock && a.current_stock <= a.minimum_stock) ? 1 : 0;
        const bLow = (!b.has_unknown_stock && b.current_stock <= b.minimum_stock) ? 1 : 0;
        return bLow - aLow;
      }
      return 0;
    });

    return result;
  }, [items, search, category, stockFilter, sortBy]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      lowStock: items.filter(i => !i.has_unknown_stock && i.current_stock > 0 && i.current_stock <= i.minimum_stock).length,
      expiring: 0,
      unknown: items.filter(i => i.has_unknown_stock).length,
    };
  }, [items]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-lav-900">Inventory</h1>
          <p className="mt-2 text-lav-700">Manage ingredients, packaging, decorations and bakery supplies.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-lav-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-lav-700 shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Add Inventory
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Package className="text-blue-500" />} label="Total Items" value={stats.total} bg="bg-blue-50" />
        <StatCard icon={<AlertTriangle className="text-orange-500" />} label="Low Stock" value={stats.lowStock} bg="bg-orange-50" />
        <StatCard icon={<Clock className="text-red-500" />} label="Expiring Soon" value={stats.expiring} bg="bg-red-50" />
        <StatCard icon={<HelpCircle className="text-slate-500" />} label="Quantity Unknown" value={stats.unknown} bg="bg-slate-50" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center rounded-2xl bg-white p-4 shadow-sm ring-1 ring-lav-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-lav-400" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-lav-200 bg-lav-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-lav-400"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-lav-200 bg-lav-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lav-400">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="rounded-xl border border-lav-200 bg-lav-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lav-400">
            {STOCK_FILTERS.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-xl border border-lav-200 bg-lav-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lav-400">
            {SORT_OPTIONS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-lav-500">Loading inventory...</div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-lav-300 bg-lav-50/50 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lav-100">
            <Package className="h-8 w-8 text-lav-400" />
          </div>
          <h3 className="text-lg font-bold text-lav-900">Your inventory is empty</h3>
          <p className="mt-1 text-sm text-lav-600">Start adding your ingredients, packaging and bakery supplies.</p>
          <button onClick={() => setShowAddModal(true)} className="mt-6 font-medium text-lav-600 hover:text-lav-800">
            + Add Inventory
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map(item => (
            <InventoryCard
              key={item.id}
              item={item}
              onView={() => setDetailsItem(item)}
              onAddPurchase={() => setPurchaseItem(item)}
              onUpdateStock={() => setUpdateStockItem(item)}
              onDelete={async () => {
                if (confirm("Delete this item?")) {
                  await deleteIngredient(item.id);
                  loadData();
                }
              }}
            />
          ))}
        </div>
      )}

      {showAddModal && <AddInventoryModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); loadData(); }} />}
      {detailsItem && <ItemDetailsDrawer item={detailsItem} onClose={() => setDetailsItem(null)} />}
      {purchaseItem && <AddPurchaseModal item={purchaseItem} onClose={() => setPurchaseItem(null)} onSuccess={() => { setPurchaseItem(null); loadData(); }} />}
      {updateStockItem && <UpdateStockModal item={updateStockItem} onClose={() => setUpdateStockItem(null)} onSuccess={() => { setUpdateStockItem(null); loadData(); }} />}
    </div>
  );
}

function StatCard({ icon, label, value, bg }: any) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-lav-100">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-lav-900">{value}</p>
        <p className="text-sm font-medium text-lav-600">{label}</p>
      </div>
    </div>
  );
}

function CategoryIcon({ category }: { category: string }) {
  if (category === "Ingredients") return <Wheat className="h-4 w-4" />;
  if (category === "Packaging") return <Box className="h-4 w-4" />;
  if (category === "Decorations") return <Sparkles className="h-4 w-4" />;
  if (category === "Bakery Supplies") return <ChefHat className="h-4 w-4" />;
  return <Package className="h-4 w-4" />;
}

function InventoryCard({ item, onView, onAddPurchase, onUpdateStock, onDelete }: any) {
  const isUnknown = item.has_unknown_stock;
  const isLowStock = !isUnknown && item.current_stock <= item.minimum_stock;
  const isOut = !isUnknown && item.current_stock <= 0;
  
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-lav-100 transition hover:shadow-md">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lav-900 line-clamp-1">{item.name}</h3>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-lav-600">
              <CategoryIcon category={item.category} />
              {item.category}
            </div>
          </div>
          
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-1.5 text-lav-400 hover:bg-lav-50 hover:text-lav-700">
              <MoreVertical className="h-5 w-5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-lav-100">
                  <button onClick={() => { setMenuOpen(false); onView(); }} className="block w-full px-4 py-2 text-left text-sm text-lav-700 hover:bg-lav-50">View Details</button>
                  <button onClick={() => { setMenuOpen(false); onAddPurchase(); }} className="block w-full px-4 py-2 text-left text-sm text-lav-700 hover:bg-lav-50">Add Purchase</button>
                  {isUnknown && <button onClick={() => { setMenuOpen(false); onUpdateStock(); }} className="block w-full px-4 py-2 text-left text-sm text-lav-700 hover:bg-lav-50">Update Stock</button>}
                  <button onClick={() => { setMenuOpen(false); onDelete(); }} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          {isUnknown ? (
            <div className="text-xl font-bold text-slate-700">Quantity Unknown</div>
          ) : (
            <div className="text-2xl font-bold text-lav-900">
              {item.current_stock} <span className="text-base font-medium text-lav-500">{item.unit}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 flex items-center justify-between border-t border-lav-100 pt-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {isUnknown ? (
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="h-2 w-2 rounded-full bg-slate-400"></span> Quantity Unknown
            </span>
          ) : isOut ? (
            <span className="flex items-center gap-1.5 text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-500"></span> Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="flex items-center gap-1.5 text-orange-600">
              <span className="h-2 w-2 rounded-full bg-orange-500"></span> Low Stock
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500"></span> In Stock
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          {isUnknown && (
            <button onClick={onUpdateStock} className="rounded-lg bg-lav-100 px-3 py-1.5 text-xs font-semibold text-lav-700 hover:bg-lav-200">
              Update Stock
            </button>
          )}
          <button onClick={onView} className="rounded-lg bg-lav-50 px-3 py-1.5 text-xs font-semibold text-lav-700 hover:bg-lav-100">
            View
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalOverlay({ children, onClose, title, subtitle }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-lav-900/40 backdrop-blur-sm sm:p-4">
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-xl sm:rounded-3xl">
        <div className="flex items-start justify-between border-b border-lav-100 p-6 pb-4">
          <div>
            <h2 className="text-xl font-bold text-lav-900">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-lav-600">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-lav-400 hover:bg-lav-50 hover:text-lav-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function AddInventoryModal({ onClose, onSuccess }: any) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Ingredients");
  const [unit, setUnit] = useState(UNITS[0]);
  const [minStock, setMinStock] = useState("");
  const [notes, setNotes] = useState("");
  
  const [hasItem, setHasItem] = useState<boolean | null>(null);
  const [knownQty, setKnownQty] = useState<boolean | null>(null);
  
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState("");
  
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hasItem && knownQty && !qty) return alert("Please enter current quantity.");
    
    setBusy(true);
    try {
      const ingredient = await addIngredient({
        name,
        category,
        unit,
        minimum_stock: Number(minStock) || 0,
        notes: notes || null,
        has_unknown_stock: hasItem === true && knownQty === false,
      });

      if (hasItem) {
        await addPurchase(ingredient.id, {
          shop_name: "Opening Stock",
          purchase_date: new Date().toISOString().slice(0, 10),
          quantity: knownQty ? Number(qty) : null,
          price: cost ? Number(cost) : null,
          expiry_date: null,
          notes: "Initial inventory setup",
          is_opening_stock: true,
        });
      }
      onSuccess();
    } catch (err: any) {
      alert("Failed to add inventory: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose} title="Add Inventory Item" subtitle="Add an ingredient, packaging item, decoration or bakery supply.">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-lav-900">
            Item Name
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cake Box" className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
          </label>
          
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-lav-900">
              Category
              <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400">
                {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-lav-900">
              Unit
              <select value={unit} onChange={e => setUnit(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400">
                {UNITS.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
          
          <label className="block text-sm font-medium text-lav-900">
            Minimum Stock (Optional)
            <input type="number" min="0" value={minStock} onChange={e => setMinStock(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
          </label>
          
          <label className="block text-sm font-medium text-lav-900">
            Notes (Optional)
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" rows={2} />
          </label>
        </div>

        <div className="border-t border-lav-100 pt-6">
          <p className="mb-3 text-sm font-semibold text-lav-900">Do you already have this item?</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setHasItem(true)} className={`rounded-xl border p-3 text-sm font-medium transition ${hasItem === true ? 'border-lav-600 bg-lav-50 text-lav-800' : 'border-lav-200 text-lav-600 hover:bg-lav-50'}`}>Yes, I already have it</button>
            <button type="button" onClick={() => setHasItem(false)} className={`rounded-xl border p-3 text-sm font-medium transition ${hasItem === false ? 'border-lav-600 bg-lav-50 text-lav-800' : 'border-lav-200 text-lav-600 hover:bg-lav-50'}`}>No, I'll purchase it later</button>
          </div>
        </div>

        {hasItem && (
          <div className="rounded-2xl bg-lav-50/50 p-4 ring-1 ring-lav-100">
            <h3 className="mb-1 font-bold text-lav-900">Opening Stock</h3>
            <p className="mb-4 text-xs text-lav-600">This is stock you already have before starting inventory tracking.</p>
            
            <p className="mb-2 text-sm font-semibold text-lav-900">Current Quantity</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button type="button" onClick={() => setKnownQty(true)} className={`rounded-xl border p-2 text-sm font-medium transition ${knownQty === true ? 'border-lav-600 bg-lav-100 text-lav-800' : 'border-lav-200 bg-white text-lav-600'}`}>I know the quantity</button>
              <button type="button" onClick={() => setKnownQty(false)} className={`rounded-xl border p-2 text-sm font-medium transition ${knownQty === false ? 'border-lav-600 bg-lav-100 text-lav-800' : 'border-lav-200 bg-white text-lav-600'}`}>Quantity Unknown</button>
            </div>

            {knownQty === true && (
              <label className="block mb-4 text-sm font-medium text-lav-900">
                Quantity ({unit})
                <input type="number" step="0.01" min="0.01" required value={qty} onChange={e => setQty(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
              </label>
            )}

            {knownQty === false && (
              <div className="mb-4 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
                You can update the quantity later when you check your stock.
              </div>
            )}

            <label className="block text-sm font-medium text-lav-900">
              Approximate Cost (Optional)
              <input type="number" step="0.01" min="0" value={cost} onChange={e => setCost(e.target.value)} placeholder="Total cost" className="mt-1 w-full rounded-xl border border-lav-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
            </label>
          </div>
        )}

        <button type="submit" disabled={busy || hasItem === null || (hasItem && knownQty === null)} className="w-full rounded-full bg-lav-600 py-3 text-sm font-bold text-white hover:bg-lav-700 disabled:opacity-50">
          {busy ? "Saving..." : "Save Item"}
        </button>
      </form>
    </ModalOverlay>
  );
}

function ItemDetailsDrawer({ item, onClose }: any) {
  const [purchases, setPurchases] = useState<IngredientPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPurchases(item.id).then(data => {
      setPurchases(data);
      setLoading(false);
    });
  }, [item.id]);

  return (
    <ModalOverlay onClose={onClose} title={item.name} subtitle={`Category: ${item.category}`}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-lav-50 p-4 ring-1 ring-lav-100">
          <div>
            <p className="text-xs font-medium text-lav-600">Current Stock</p>
            <p className="text-lg font-bold text-lav-900">{item.has_unknown_stock ? "Unknown" : `${item.current_stock} ${item.unit}`}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-lav-600">Minimum Stock</p>
            <p className="text-lg font-bold text-lav-900">{item.minimum_stock} {item.unit}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-lav-600">Status</p>
            <p className="text-sm font-bold text-lav-900">
              {item.has_unknown_stock ? "Quantity Unknown" : item.current_stock <= 0 ? "Out of Stock" : item.current_stock <= item.minimum_stock ? "Low Stock" : "In Stock"}
            </p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-bold text-lav-900">Purchase History</h3>
          {loading ? (
            <p className="text-sm text-lav-500">Loading history...</p>
          ) : purchases.length === 0 ? (
            <p className="text-sm text-lav-500">No purchases found.</p>
          ) : (
            <div className="space-y-3">
              {purchases.map(p => (
                <div key={p.id} className="flex flex-col justify-between rounded-xl border border-lav-100 p-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-semibold text-lav-900">{p.is_opening_stock ? "Opening Stock" : (p.shop_name || "Unknown Shop")}</p>
                    <p className="text-xs text-lav-500">{p.purchase_date}</p>
                  </div>
                  <div className="mt-2 text-right sm:mt-0">
                    <p className="font-semibold text-lav-900">{p.quantity ? `${p.quantity} ${item.unit}` : "Unknown Qty"}</p>
                    {p.price && <p className="text-xs text-green-700">{rupees(p.price)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}

function AddPurchaseModal({ item, onClose, onSuccess }: any) {
  const [shopName, setShopName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [expiry, setExpiry] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await addPurchase(item.id, {
        shop_name: shopName || "Unknown Shop",
        purchase_date: date,
        quantity: Number(qty),
        price: Number(price),
        expiry_date: expiry || null,
        notes: notes || null,
        is_opening_stock: false,
      });
      // also if the item had unknown stock, we might want to clear it? the backend does it automatically or not?
      // actually, if we add purchase, we just add purchase. The backend might add it to current_stock.
      onSuccess();
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  const q = Number(qty) || 0;
  const p = Number(price) || 0;
  const cpu = q > 0 ? (p / q).toFixed(2) : "0.00";

  return (
    <ModalOverlay onClose={onClose} title="Add Purchase" subtitle={`For ${item.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-lav-900">
          Shop Name
          <input required value={shopName} onChange={e => setShopName(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
        </label>
        
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-medium text-lav-900">
            Quantity ({item.unit})
            <input type="number" step="0.01" min="0.01" required value={qty} onChange={e => setQty(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
          </label>
          <label className="block text-sm font-medium text-lav-900">
            Total Price (₹)
            <input type="number" step="0.01" min="0" required value={price} onChange={e => setPrice(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
          </label>
        </div>

        <div className="rounded-lg bg-lav-50 p-3 text-sm text-lav-700">
          Cost per unit: <strong>₹{cpu} / {item.unit}</strong>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-medium text-lav-900">
            Purchase Date
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
          </label>
          <label className="block text-sm font-medium text-lav-900">
            Expiry Date
            <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" />
          </label>
        </div>

        <label className="block text-sm font-medium text-lav-900">
          Notes
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 w-full rounded-xl border border-lav-200 bg-lav-50 px-3 py-2 outline-none focus:ring-2 focus:ring-lav-400" rows={2} />
        </label>

        <button type="submit" disabled={busy} className="mt-4 w-full rounded-full bg-lav-600 py-3 text-sm font-bold text-white hover:bg-lav-700 disabled:opacity-50">
          {busy ? "Saving..." : "Save Purchase"}
        </button>
      </form>
    </ModalOverlay>
  );
}

function UpdateStockModal({ item, onClose, onSuccess }: any) {
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await updateIngredient(item.id, {
        name: item.name,
        category: item.category,
        unit: item.unit,
        minimum_stock: item.minimum_stock,
        notes: item.notes,
        has_unknown_stock: false,
      });
      // also record a stock update purchase? the backend for 'has_unknown_stock' logic is simple.
      // but we need to set the actual quantity. There's no direct 'update current stock' endpoint in the API 
      // except adding a purchase. So we will add an "Opening Stock" purchase to set the quantity since it was unknown.
      await addPurchase(item.id, {
        shop_name: "Stock Update",
        purchase_date: new Date().toISOString().slice(0, 10),
        quantity: Number(qty),
        price: 0,
        expiry_date: null,
        notes: "Manual stock update",
        is_opening_stock: true,
      });

      onSuccess();
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose} title="Update Current Stock" subtitle={`For ${item.name}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <label className="block text-sm font-medium text-lav-900">
          Current Quantity
          <div className="relative mt-1 flex items-center">
            <input type="number" step="0.01" min="0" required value={qty} onChange={e => setQty(e.target.value)} className="w-full rounded-xl border border-lav-200 bg-lav-50 py-3 pl-4 pr-16 text-lg font-bold outline-none focus:ring-2 focus:ring-lav-400" />
            <span className="absolute right-4 text-lav-500 font-medium">{item.unit}</span>
          </div>
        </label>
        
        <button type="submit" disabled={busy} className="w-full rounded-full bg-lav-600 py-3 text-sm font-bold text-white hover:bg-lav-700 disabled:opacity-50">
          {busy ? "Saving..." : "Save Stock"}
        </button>
      </form>
    </ModalOverlay>
  );
}
