import { useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { 
  Home, 
  Package, 
  BookOpen, 
  Users, 
  ShoppingCart, 
  CreditCard, 
  Settings, 
  LogOut, 
  Menu,
  CakeSlice
} from "lucide-react";

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "Pantry", path: "/pantry", icon: Package },
    { name: "Recipes", path: "/recipes", icon: BookOpen },
    { name: "Customers", path: "/customers", icon: Users },
    { name: "Orders", path: "/orders", icon: ShoppingCart },
    { name: "Expenses", path: "/expenses", icon: CreditCard },
  ];

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-lav-50/50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-lav-900/20 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform flex-col justify-between border-r border-lav-200 bg-white/80 shadow-lg shadow-lav-200/40 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:flex lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col px-4 py-6">
          <div className="mb-8 flex items-center gap-3 px-2 text-lav-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lav-100 text-lav-600 ring-1 ring-lav-300/50">
              <CakeSlice className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">Brio Delights</span>
          </div>

          <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path === "/dashboard" && location.pathname === "/home");
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-lav-600 text-white shadow-md shadow-lav-500/20"
                      : "text-lav-700 hover:bg-lav-100 hover:text-lav-900"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "text-lav-50" : "text-lav-500"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 flex flex-col gap-1.5 border-t border-lav-200/60 pt-6">
            <Link
              to="/settings"
              onClick={closeSidebar}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                location.pathname === "/settings"
                  ? "bg-lav-600 text-white shadow-md shadow-lav-500/20"
                  : "text-lav-700 hover:bg-lav-100 hover:text-lav-900"
              }`}
            >
              <Settings className={`h-5 w-5 ${location.pathname === "/settings" ? "text-lav-50" : "text-lav-500"}`} />
              Settings
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-5 w-5 text-red-500" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-lav-200/60 bg-white/60 px-4 shadow-sm backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg p-2 text-lav-700 hover:bg-lav-100 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-lav-900 lg:hidden">
              {navItems.find((i) => i.path === location.pathname)?.name || "Brio Delights"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-lav-900">{user.display_name}</span>
              <span className="text-xs font-medium text-lav-600">{user.bakery_name || "Your bakery"}</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lav-600 font-bold text-white shadow-sm ring-2 ring-white">
              {user.display_name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
