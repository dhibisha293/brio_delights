import { useState, useEffect, useMemo } from "react";
import {
  ShoppingCart,
  Search,
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  X,
  AlertTriangle,
  DollarSign,
  Package,
} from "lucide-react";
import { Order, listOrders, addOrder, updateOrder, deleteOrder } from "../api";

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    product_type: "Cake",
    product_name: "",
    flavour: "",
    quantity: "",
    price: "",
    order_date: new Date().toISOString().split("T")[0],
    delivery_date: "",
    status: "Pending",
    payment_status: "Not Paid",
    advance_amount: "",
    notes: "",
  });

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await listOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openForm = (order?: Order) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        customer_name: order.customer_name,
        customer_phone: order.customer_phone || "",
        product_type: order.product_type,
        product_name: order.product_name,
        flavour: order.flavour || "",
        quantity: order.quantity,
        price: order.price.toString(),
        order_date: order.order_date,
        delivery_date: order.delivery_date || "",
        status: order.status,
        payment_status: order.payment_status,
        advance_amount: order.advance_amount ? order.advance_amount.toString() : "",
        notes: order.notes || "",
      });
    } else {
      setEditingOrder(null);
      setFormData({
        customer_name: "",
        customer_phone: "",
        product_type: "Cake",
        product_name: "",
        flavour: "",
        quantity: "",
        price: "",
        order_date: new Date().toISOString().split("T")[0],
        delivery_date: "",
        status: "Pending",
        payment_status: "Not Paid",
        advance_amount: "",
        notes: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone || null,
        product_type: formData.product_type,
        product_name: formData.product_name,
        flavour: formData.flavour || null,
        quantity: formData.quantity,
        price: parseFloat(formData.price),
        order_date: formData.order_date,
        delivery_date: formData.delivery_date || null,
        status: formData.status,
        payment_status: formData.payment_status,
        advance_amount: formData.advance_amount ? parseFloat(formData.advance_amount) : null,
        notes: formData.notes || null,
      };

      if (editingOrder) {
        await updateOrder(editingOrder.id, payload);
      } else {
        await addOrder(payload);
      }
      setIsFormOpen(false);
      loadOrders();
    } catch (err: any) {
      alert(err.message || "Failed to save order");
    }
  };

  const handleDelete = async () => {
    if (!orderToDelete) return;
    try {
      await deleteOrder(orderToDelete.id);
      setIsDeleteOpen(false);
      setOrderToDelete(null);
      loadOrders();
    } catch (err: any) {
      alert(err.message || "Failed to delete order");
    }
  };

  const viewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        o.product_name.toLowerCase().includes(search.toLowerCase()) ||
        (o.flavour && o.flavour.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === "All" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const totalSales = orders.reduce((acc, o) => acc + o.price, 0);
  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const completedOrders = orders.filter((o) => o.status === "Completed").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Confirmed": return "bg-blue-100 text-blue-800";
      case "Preparing": return "bg-purple-100 text-purple-800";
      case "Ready": return "bg-green-100 text-green-800";
      case "Completed": return "bg-gray-100 text-gray-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-lav-900">Orders</h1>
          <p className="mt-2 text-lav-700">Manage your bakery orders.</p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center justify-center gap-2 rounded-xl bg-lav-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-lav-700 shadow-md shadow-lav-500/20"
        >
          <Plus className="h-5 w-5" />
          Add Order
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-lav-100">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-lav-600">Total Orders</p>
              <p className="text-2xl font-bold text-lav-900">{orders.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-lav-100">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-lav-600">Pending</p>
              <p className="text-2xl font-bold text-lav-900">{pendingOrders}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-lav-100">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-lav-600">Completed</p>
              <p className="text-2xl font-bold text-lav-900">{completedOrders}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-lav-100">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lav-50 text-lav-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-lav-600">Total Sales</p>
              <p className="text-2xl font-bold text-lav-900">₹{totalSales.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and List */}
      <div className="rounded-2xl bg-white shadow-sm border border-lav-200 overflow-hidden">
        <div className="border-b border-lav-100 bg-lav-50/50 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-lav-400" />
              <input
                type="text"
                placeholder="Search by customer, product, or flavour..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-lav-200 py-2.5 pl-10 pr-4 text-sm focus:border-lav-500 focus:outline-none focus:ring-1 focus:ring-lav-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-lav-200 bg-white py-2.5 pl-4 pr-10 text-sm focus:border-lav-500 focus:outline-none focus:ring-1 focus:ring-lav-500"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Preparing">Preparing</option>
              <option value="Ready">Ready</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-lav-600">Loading orders...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-lav-300" />
            <h3 className="mt-4 text-lg font-medium text-lav-900">No orders found</h3>
            <p className="mt-2 text-lav-500">Add an order to get started or change your search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-lav-700">
              <thead className="bg-lav-50 text-xs font-semibold uppercase tracking-wider text-lav-500">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lav-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-lav-50/50 transition-colors cursor-pointer" onClick={() => viewDetails(order)}>
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-lav-900">
                      {order.customer_name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-lav-900">{order.product_name}</div>
                      {order.flavour && <div className="text-xs text-lav-500">{order.flavour}</div>}
                      <div className="text-xs text-lav-400">{order.product_type}</div>
                    </td>
                    <td className="px-6 py-4">{order.quantity}</td>
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-lav-900">
                      ₹{order.price.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openForm(order)}
                          className="rounded-lg p-2 text-lav-500 hover:bg-lav-100 hover:text-lav-700"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setOrderToDelete(order);
                            setIsDeleteOpen(true);
                          }}
                          className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-lav-900/40 p-4 backdrop-blur-sm sm:p-6">
          <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-lav-100 bg-white/80 px-6 py-4 backdrop-blur-md">
              <h2 className="text-xl font-bold text-lav-900">
                {editingOrder ? "Edit Order" : "Add New Order"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-full p-2 text-lav-400 hover:bg-lav-100 hover:text-lav-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6">
              <div className="space-y-6">
                
                {/* Customer Details */}
                <div>
                  <h3 className="text-lg font-medium text-lav-900 mb-4">Customer Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-lav-700 mb-1">Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.customer_name}
                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                        className="w-full rounded-xl border border-lav-200 px-4 py-2.5 focus:border-lav-500 focus:outline-none focus:ring-1 focus:ring-lav-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-lav-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={formData.customer_phone}
                        onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                        className="w-full rounded-xl border border-lav-200 px-4 py-2.5 focus:border-lav-500 focus:outline-none focus:ring-1 focus:ring-lav-500"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-lav-100" />

                {/* Product Details */}
                <div>
                  <h3 className="text-lg font-medium text-lav-900 mb-4">Product Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-lav-700 mb-1">Product Type *</label>
                      <select
                        required
                        value={formData.product_type}
                        onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                        className="w-full rounded-xl border border-lav-200 px-4 py-2.5 focus:border-lav-500 focus:outline-none focus:ring-1 focus:ring-lav-500"
                      >
                        <option value="Cake">Cake</option>
                        <option value="Brownie">Brownie</option>
                        <option value="Cupcake">Cupcake</option>
                        <option value="Cookie">Cookie</option>
                        <option value="Puff">Puff</option>
                        <option value="Dessert">Dessert</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-lav-700 mb-1">Product Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chocolate Cake"
                        value={formData.product_name}
                        onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                        className="w-full rounded-xl border border-lav-200 px-4 py-2.5 focus:border-lav-500 focus:outline-none focus:ring-1 focus:ring-lav-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-lav-700 mb-1">Flavour</label>
                      <input
                        type="text"
                        placeholder="e.g. Vanilla, Chocolate"
                        value={formData.flavour}
                        onChange={(e) => setFormData({ ...formData, flavour: e.target.value })}
                        className="w-full rounded-xl border border-lav-200 px-4 py-2.5 focus:border-lav-500 focus:outline-none focus:ring-1 focus:ring-lav-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-lav-700 mb-1">Quantity *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1 kg, 2 boxes"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="w-full rounded-xl border border-lav-200 px-4 py-2.5 focus:border-lav-500 focus:outline-none focus:ring-1 focus:ring-lav-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-lav-700 mb-1">Total Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full rounded-xl border border-lav-200 px-4 py-2.5 focus:border-lav-500 focus:outline-none focus:ring-1 focus:ring-lav-500"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-lav-100" />

                {/* Order Status & Dates */}
                <div>
                  <h3 className="text-lg font-medium text-lav-900 mb-4">Dates & Status</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-lav-700 mb-1">Order Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.order_date}
                        onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                        className="w-full rounded-xl border border-lav-200 px-4 py-2.5 focus:border-lav-500 focus:outline-none focus:ring-1 focus:ring-lav-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-lav-700 mb-1">Delivery/Pickup Date</label>
                      <input
                        type="date"
                        value={formData.delivery_date}
                        onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                        className="w-full rounded-xl border border-lav-200 px-4 py-2.5 focus:border-lav-500 focus:outline-none focus:ring-1 focus:ring-lav-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-lav-700 mb-1">Order Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full rounded-xl border border-lav-200 px-4 py-2.5 focus:border-lav-500 focus:outline-none focus:ring-1 focus:ring-lav-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Ready">Ready</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-lav-700 mb-1">Payment Status</label>
                      <select
                        value={formData.payment_status}
                        onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                        className="w-full rounded-xl border border-lav-200 px-4 py-2.5 focus:border-lav-500 focus:outline-none focus:ring-1 focus:ring-lav-500"
                      >
                        <option value="Not Paid">Not Paid</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-lav-700 mb-1">Advance Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={formData.price || undefined}
                        value={formData.advance_amount}
                        onChange={(e) => setFormData({ ...formData, advance_amount: e.target.value })}
                        className="w-full rounded-xl border border-lav-200 px-4 py-2.5 focus:border-lav-500 focus:outline-none focus:ring-1 focus:ring-lav-500"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-lav-100" />

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-lav-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Any special instructions..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-xl border border-lav-200 px-4 py-2.5 focus:border-lav-500 focus:outline-none focus:ring-1 focus:ring-lav-500"
                  />
                </div>

              </div>
              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-lav-600 transition-colors hover:bg-lav-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-lav-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-lav-700 shadow-md shadow-lav-500/20"
                >
                  {editingOrder ? "Save Changes" : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-lav-900/40 p-4 backdrop-blur-sm sm:p-6" onClick={() => setIsDetailsOpen(false)}>
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-lav-100 bg-white/80 px-6 py-4 backdrop-blur-md">
              <h2 className="text-xl font-bold text-lav-900">Order Details</h2>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="rounded-full p-2 text-lav-400 hover:bg-lav-100 hover:text-lav-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-lav-900">{selectedOrder.customer_name}</h3>
                  {selectedOrder.customer_phone && <p className="text-lav-600">{selectedOrder.customer_phone}</p>}
                </div>
                <div className="text-right">
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="rounded-2xl bg-lav-50 p-5 border border-lav-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-lav-900 text-lg">{selectedOrder.product_name}</p>
                    <p className="text-lav-600 text-sm">{selectedOrder.product_type} {selectedOrder.flavour && `• ${selectedOrder.flavour}`}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lav-900 text-lg">₹{selectedOrder.price.toFixed(2)}</p>
                    <p className="text-lav-600 text-sm">Qty: {selectedOrder.quantity}</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-lav-500 uppercase tracking-wider">Order Date</p>
                  <p className="mt-1 font-medium text-lav-900">{new Date(selectedOrder.order_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-lav-500 uppercase tracking-wider">Delivery Date</p>
                  <p className="mt-1 font-medium text-lav-900">{selectedOrder.delivery_date ? new Date(selectedOrder.delivery_date).toLocaleDateString() : "Not set"}</p>
                </div>
              </div>

              <hr className="border-lav-100" />

              {/* Payment Info */}
              <div>
                <h4 className="text-sm font-semibold text-lav-900 mb-3">Payment Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-lav-600">Payment Status:</span>
                    <span className="font-medium text-lav-900">{selectedOrder.payment_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-lav-600">Total Price:</span>
                    <span className="font-medium text-lav-900">₹{selectedOrder.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-lav-600">Advance Paid:</span>
                    <span className="font-medium text-lav-900">₹{(selectedOrder.advance_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-lav-100">
                    <span className="font-semibold text-lav-900">Balance Due:</span>
                    <span className="font-bold text-red-600">
                      ₹{Math.max(0, selectedOrder.price - (selectedOrder.advance_amount || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <>
                  <hr className="border-lav-100" />
                  <div>
                    <h4 className="text-sm font-semibold text-lav-900 mb-2">Notes</h4>
                    <p className="text-sm text-lav-700 whitespace-pre-wrap bg-yellow-50/50 p-3 rounded-xl border border-yellow-100/50">
                      {selectedOrder.notes}
                    </p>
                  </div>
                </>
              )}

            </div>
            
            <div className="border-t border-lav-100 bg-lav-50/50 px-6 py-4 flex justify-end gap-3 rounded-b-3xl">
               <button
                  onClick={() => {
                    setIsDetailsOpen(false);
                    openForm(selectedOrder);
                  }}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-lav-600 transition-colors hover:bg-lav-100 border border-lav-200 bg-white"
                >
                  Edit Order
                </button>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="rounded-xl bg-lav-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-lav-700 shadow-md shadow-lav-500/20"
                >
                  Close
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteOpen && orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-lav-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-bold text-gray-900">Delete Order?</h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete this order for <strong>{orderToDelete.customer_name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 shadow-md shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
