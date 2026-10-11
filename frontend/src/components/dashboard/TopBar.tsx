import { useAuth } from "../../AuthContext";
import ThemeToggle from "./ThemeToggle";

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title = "Dashboard" }: TopBarProps) {
  const { user } = useAuth();
  const displayName = user?.display_name || "Admin";
  const bakeryName = user?.bakery_name || "Brio Delights";
  const initial = displayName.charAt(0).toUpperCase();

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="top">
      <div>
        <h2>{title}</h2>
        <time id="today">{today}</time>
      </div>
      <div className="top-right">
        <ThemeToggle />
        <div className="me">
          <div className="me-avatar" aria-hidden="true">
            {initial}
          </div>
          <div>
            <b>{displayName}</b>
            <span>{bakeryName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
