import { useNavigate } from "react-router-dom";

interface OrdersRingProps {
  totalOrders: number;
  completedCount: number;
  pendingCount: number;
  onAddOrder?: () => void;
}

export default function OrdersRing({
  totalOrders,
  completedCount,
  pendingCount,
  onAddOrder,
}: OrdersRingProps) {
  const navigate = useNavigate();

  const ratio = totalOrders > 0 ? completedCount / totalOrders : 0;
  const circumference = 314;
  const strokeDashoffset = Math.round(circumference - ratio * circumference);

  const message =
    totalOrders === 0
      ? "No orders placed yet."
      : pendingCount === 0
      ? "No pending orders right now."
      : `${pendingCount} order${pendingCount > 1 ? "s" : ""} waiting.`;

  const handleClick = () => {
    if (onAddOrder) {
      onAddOrder();
    } else {
      navigate("/orders");
    }
  };

  return (
    <section className="card orders">
      <div className="card-head">
        <h3>Orders</h3>
        <p className="hint">Completed vs pending</p>
      </div>

      <div
        className="ring"
        role="img"
        aria-label={`${completedCount} of ${totalOrders} orders completed`}
      >
        <svg viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="var(--track)"
            strokeWidth="14"
          />
          <circle
            className="arc"
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="var(--mint)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray="314"
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="ring-c">
          <b>{completedCount}</b>
          <span>completed</span>
        </div>
      </div>

      <p className="msg">{message}</p>
      <button className="ghost" type="button" onClick={handleClick}>
        Add an order
      </button>
    </section>
  );
}
