import { NavLink } from "react-router-dom";
import { useAuth } from "../../AuthContext";

export default function Sidebar() {
  const { user } = useAuth();
  const bakeryName = user?.bakery_name || "Bakery manager";

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: "#i-home" },
    { to: "/pantry",    label: "Pantry",    icon: "#i-box" },
    { to: "/recipes",   label: "Recipes",   icon: "#i-book" },
    { to: "/customers", label: "Customers", icon: "#i-users" },
    { to: "/orders",    label: "Orders",    icon: "#i-cart" },
    { to: "/expenses",  label: "Expenses",  icon: "#i-card" },
  ];

  return (
    <aside className="rail">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">🧁</div>
        <div>
          <div className="brand-name">Brio Delights</div>
          <div className="brand-sub">{bakeryName}</div>
        </div>
      </div>
      <nav className="nav" aria-label="Main">
        {navLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <svg className="icon">
              <use href={item.icon} />
            </svg>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
