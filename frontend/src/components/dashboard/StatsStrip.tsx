import { useEffect, useState } from "react";

interface StatsStripProps {
  totalOrders: number;
  pendingCount: number;
  completedCount: number;
  totalSales: number;
  expenses: number;
  profit: number;
}

function useCountUp(target: number, prefix: string = ""): string {
  const [display, setDisplay] = useState(() => `${prefix}0`);

  useEffect(() => {
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setDisplay(`${prefix}${Math.round(target).toLocaleString("en-IN")}`);
      return;
    }

    let startTime: number | null = null;
    const duration = 1300;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min(1, (timestamp - startTime) / duration);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * ease);
      setDisplay(`${prefix}${current.toLocaleString("en-IN")}`);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    const timer = setTimeout(() => {
      animId = requestAnimationFrame(step);
    }, 350);

    return () => {
      clearTimeout(timer);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [target, prefix]);

  return display;
}

export default function StatsStrip({
  totalOrders,
  pendingCount,
  completedCount,
  totalSales,
  expenses,
  profit,
}: StatsStripProps) {
  const totalOrdersStr = useCountUp(totalOrders, "");
  const totalSalesStr = useCountUp(totalSales, "₹");
  const expensesStr = useCountUp(expenses, "₹");
  const profitStr = useCountUp(profit, "₹");

  return (
    <div className="strip" role="list">
      <div className="stat" role="listitem">
        <div className="stat-label">
          <span className="dot" style={{ "--c": "var(--rose)" } as React.CSSProperties}></span>
          Total orders
        </div>
        <div className="stat-value" data-count={totalOrders}>
          {totalOrdersStr}
        </div>
        <div className="stat-note">{pendingCount} pending</div>
      </div>

      <div className="stat" role="listitem">
        <div className="stat-label">
          <span className="dot" style={{ "--c": "var(--mint)" } as React.CSSProperties}></span>
          Total sales
        </div>
        <div className="stat-value" data-count={totalSales} data-prefix="₹">
          {totalSalesStr}
        </div>
        <div className="stat-note">{completedCount} completed</div>
      </div>

      <div className="stat" role="listitem">
        <div className="stat-label">
          <span className="dot" style={{ "--c": "var(--hero)" } as React.CSSProperties}></span>
          Expenses
        </div>
        <div className="stat-value" data-count={expenses} data-prefix="₹">
          {expensesStr}
        </div>
        <div className="stat-note">This month, estimated</div>
      </div>

      <div className="stat profit" role="listitem">
        <div className="stat-label">
          <span className="dot" style={{ "--c": "var(--peach)" } as React.CSSProperties}></span>
          Profit
        </div>
        <div className="stat-value" data-count={profit} data-prefix="₹">
          {profitStr}
        </div>
        <div className="stat-note">This month, estimated</div>
      </div>
    </div>
  );
}
