import { Users } from "lucide-react";

export default function Customers() {
  return (
    <div style={{ maxWidth: "64rem", margin: "0 auto" }} className="space-y-8">
      <div>
        <h1 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: "2rem", color: "var(--ink)", margin: 0 }}>
          Customers
        </h1>
        <p style={{ marginTop: "0.5rem", color: "var(--muted)", fontWeight: 600 }}>
          Manage your bakery's customer list.
        </p>
      </div>

      <div className="card" style={{ minHeight: "400px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", border: "2px dashed var(--line)" }}>
        <div style={{ marginBottom: "1rem", display: "flex", width: 64, height: 64, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--blush)", color: "var(--hero)" }}>
          <Users size={32} />
        </div>
        <h2 style={{ marginBottom: "0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)" }}>Customer Management</h2>
        <p style={{ maxWidth: "36rem", color: "var(--muted)", fontWeight: 600 }}>
          Customer tracking functionality will be added here in a future update. You'll be able to see contact details, order history, and preferences.
        </p>
      </div>
    </div>
  );
}
