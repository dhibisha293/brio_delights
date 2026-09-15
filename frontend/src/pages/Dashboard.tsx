import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { PlusCircle, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const stats = [
    { name: "Total Orders", value: "24", icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "Total Sales", value: "$1,250", icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
    { name: "Expenses", value: "$430", icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-100" },
    { name: "Profit", value: "$820", icon: DollarSign, color: "text-lav-600", bg: "bg-lav-100" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-lav-900">Welcome back, {user?.display_name.split(" ")[0]}!</h1>
        <p className="mt-2 text-lav-700">Here's what's happening at {user?.bakery_name || "your bakery"} today.</p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-lav-900">Today's Overview</h2>
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
