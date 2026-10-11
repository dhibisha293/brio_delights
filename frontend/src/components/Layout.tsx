import { Navigate, Outlet, useLocation } from "react-router-dom";
import AIChatWidget from "./AIChatWidget";
import { useAuth } from "../AuthContext";
import { Sidebar, TopBar, DashboardIcons } from "./dashboard";

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/dashboard" replace />;
  }

  const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/home": "Dashboard",
    "/pantry": "Pantry",
    "/recipes": "Recipes",
    "/customers": "Customers",
    "/orders": "Orders",
    "/expenses": "Expenses",
    "/settings": "Settings",
  };

  const title = pageTitles[location.pathname] || "Dashboard";

  return (
    <div className="brio-app">
      <DashboardIcons />
      <Sidebar />
      <main className="main">
        <TopBar title={title} />
        <Outlet />
      </main>
      <AIChatWidget />
    </div>
  );
}
