import { CreditCard } from "lucide-react";

export default function Expenses() {
  return (
    <div style={{ maxWidth: "64rem", margin: "0 auto" }} className="space-y-8">
      <div>
        <h1 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: "2rem", color: "var(--ink)", margin: 0 }}>
          Expenses
        </h1>
        <p style={{ marginTop: "0.5rem", color: "var(--muted)", fontWeight: 600 }}>
          Track your bakery's non-ingredient expenses.
        </p>
      </div>

      <div className="card" style={{ minHeight: "400px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", border: "2px dashed var(--line)" }}>
        <div style={{ marginBottom: "1rem", display: "flex", width: 64, height: 64, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--blush)", color: "var(--hero)" }}>
          <CreditCard size={32} />
        </div>
        <h2 style={{ marginBottom: "0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)" }}>Expense Tracking</h2>
        <p style={{ maxWidth: "36rem", color: "var(--muted)", fontWeight: 600 }}>
          Expense tracking will be added here. You'll be able to log packaging, marketing, delivery, and other business expenses to accurately calculate profit.
        </p>
      </div>
    </div>
  );
}
