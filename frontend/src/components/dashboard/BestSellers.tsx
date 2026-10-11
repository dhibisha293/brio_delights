import { useMemo } from "react";
import { Order } from "../../api";

interface BestSellersProps {
  orders: Order[];
}

function getProductEmoji(name: string, type?: string): string {
  const text = `${name} ${type || ""}`.toLowerCase();
  if (text.includes("brownie") || text.includes("choco") || text.includes("truffle")) return "🍫";
  if (text.includes("cupcake") || text.includes("muffin")) return "🧁";
  if (text.includes("cookie") || text.includes("biscuit")) return "🍪";
  if (text.includes("pastry") || text.includes("croissant")) return "🥐";
  if (text.includes("bread") || text.includes("loaf") || text.includes("bun")) return "🍞";
  if (text.includes("cake")) return "🎂";
  return "🧁";
}

const BAR_COLORS = ["var(--hero)", "var(--rose)", "var(--petal)"];

export default function BestSellers({ orders }: BestSellersProps) {
  const currentMonthName = new Date().toLocaleString("en-IN", { month: "long" });
  const currentMonthIdx = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const topProducts = useMemo(() => {
    // Filter this month's valid sales
    const thisMonthOrders = orders.filter((o) => {
      if (o.status === "Pending" && o.payment_status === "Not Paid") return false;
      const d = new Date(o.order_date);
      return d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear;
    });

    // If no sales this month, fallback to all-time orders so the list is informative
    const targetOrders = thisMonthOrders.length > 0 ? thisMonthOrders : orders;

    const grouped = targetOrders.reduce((acc, order) => {
      if (order.status === "Pending" && order.payment_status === "Not Paid") return acc;
      const name = order.product_name || "Unknown Product";
      if (!acc[name]) {
        acc[name] = { name, sales: 0, type: order.product_type };
      }
      acc[name].sales += order.price;
      return acc;
    }, {} as Record<string, { name: string; sales: number; type: string }>);

    const sorted = Object.values(grouped).sort((a, b) => b.sales - a.sales);
    return sorted.slice(0, 3);
  }, [orders, currentMonthIdx, currentYear]);

  const topSellerAmount = topProducts[0]?.sales || 1;

  return (
    <section className="card">
      <h3>Best sellers this month</h3>
      <p className="hint">Ranked by sales in {currentMonthName}</p>

      {topProducts.length === 0 ? (
        <p className="hint" style={{ marginBottom: 0, fontStyle: "italic" }}>
          No orders placed yet this month.
        </p>
      ) : (
        <ul className="sellers">
          {topProducts.map((p, idx) => {
            const widthPct = Math.round((p.sales / topSellerAmount) * 100);
            const color = BAR_COLORS[idx] || "var(--petal)";
            const emoji = getProductEmoji(p.name, p.type);

            return (
              <li key={p.name} className="seller">
                <div className="seller-badge" aria-hidden="true">
                  {emoji}
                </div>
                <div>
                  <div className="seller-name">{p.name}</div>
                  <div className="bar">
                    <i
                      style={
                        {
                          "--w": `${widthPct}%`,
                          "--c": color,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>
                <div className="seller-amt">
                  ₹{Math.round(p.sales).toLocaleString("en-IN")}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
