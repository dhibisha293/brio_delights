import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { PlusCircle, ShoppingBag, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { Order, listOrders } from "../api";

export default function Dashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await listOrders();
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders for dashboard", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const totalSales = orders.reduce((acc, order) => acc + order.price, 0);

  const stats = [
    { name: "Total Orders", value: isLoading ? "..." : orders.length.toString(), icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "Total Sales", value: isLoading ? "..." : `₹${totalSales.toFixed(2)}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
    { name: "Expenses (Placeholder)", value: "₹430", icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-100" },
    { name: "Profit (Placeholder)", value: "₹820", icon: DollarSign, color: "text-lav-600", bg: "bg-lav-100" },
  ];

  const monthlySales = useMemo(() => {
    const grouped = orders.reduce((acc, order) => {
      const date = new Date(order.order_date);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[sortKey]) {
        acc[sortKey] = { label: monthYear, sales: 0 };
      }
      acc[sortKey].sales += order.price;
      return acc;
    }, {} as Record<string, { label: string, sales: number }>);

    // Sort chronologically and return array
    return Object.keys(grouped)
      .sort()
      .map(key => grouped[key]);
  }, [orders]);

  const maxSales = Math.max(...monthlySales.map(m => m.sales), 1);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-lav-900">Welcome back, {user?.display_name.split(" ")[0]}!</h1>
        <p className="mt-2 text-lav-700">Here's what's happening at {user?.bakery_name || "your bakery"}.</p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-lav-900">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.name} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-lav-200/50">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-lav-600">{stat.name}</p>
                <p className="text-2xl font-bold text-lav-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Monthly Sales Section */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-lav-900">Sales by Month</h2>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-lav-200/50">
          {isLoading ? (
            <p className="text-lav-500">Loading sales data...</p>
          ) : monthlySales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-lav-500">
              <Calendar className="h-10 w-10 text-lav-300 mb-2" />
              <p>No sales data available yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {monthlySales.map((month) => (
                <div key={month.label} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium text-lav-700">{month.label}</div>
                  <div className="flex-1 bg-lav-50 rounded-full h-4 overflow-hidden border border-lav-100">
                    <div 
                      className="bg-lav-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(month.sales / maxSales) * 100}%` }}
                    />
                  </div>
                  <div className="w-24 text-right text-sm font-bold text-lav-900">₹{month.sales.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-lav-900">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            to="/orders"
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-lav-300 bg-lav-50/50 p-6 text-lav-700 transition-colors hover:border-lav-400 hover:bg-lav-100 hover:text-lav-900"
          >
            <PlusCircle className="h-8 w-8 text-lav-500 group-hover:text-lav-600" />
            <span className="font-semibold">Add Order</span>
          </Link>
          <Link
            to="/pantry"
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-lav-300 bg-lav-50/50 p-6 text-lav-700 transition-colors hover:border-lav-400 hover:bg-lav-100 hover:text-lav-900"
          >
            <PlusCircle className="h-8 w-8 text-lav-500 group-hover:text-lav-600" />
            <span className="font-semibold">Add Ingredient</span>
          </Link>
          <Link
            to="/customers"
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-lav-300 bg-lav-50/50 p-6 text-lav-700 transition-colors hover:border-lav-400 hover:bg-lav-100 hover:text-lav-900"
          >
            <PlusCircle className="h-8 w-8 text-lav-500 group-hover:text-lav-600" />
            <span className="font-semibold">Add Customer</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
