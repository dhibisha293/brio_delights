import { useState, useEffect } from "react";
import { Order, listOrders, listPantry, PantryItem } from "../api";
import {
  AwningHero,
  StatsStrip,
  BestSellers,
  OrdersRing,
  CakeChart,
} from "../components/dashboard";

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  useEffect(() => {
    Promise.all([
      listOrders().catch((err) => {
        console.error("Failed to load orders", err);
        return [] as Order[];
      }),
      listPantry().catch((err) => {
        console.error("Failed to load pantry", err);
        return [] as PantryItem[];
      }),
    ]).then(([ordersData, pantryData]) => {
      setOrders(ordersData);
      setPantryItems(pantryData);
    });
  }, []);

  const totalSales = orders.reduce((acc, order) => {
    if (order.status === "Pending" && order.payment_status === "Not Paid") return acc;
    return acc + order.price;
  }, 0);

  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const completedCount = orders.filter((o) => o.status === "Completed").length;
  const totalOrders = orders.length;

  const pantryExpenses = pantryItems.reduce((acc, item) => acc + (item.cost || 0), 0);
  const expenses = pantryExpenses > 0 ? pantryExpenses : 430;
  const profit = Math.max(0, totalSales - expenses);

  return (
    <div className="board">
      <div className="col">
        <section>
          <AwningHero
            totalOrders={totalOrders}
            pendingCount={pendingCount}
          />
          <StatsStrip
            totalOrders={totalOrders}
            pendingCount={pendingCount}
            completedCount={completedCount}
            totalSales={totalSales}
            expenses={expenses}
            profit={profit}
          />
        </section>

        <div className="lower">
          <BestSellers orders={orders} />
          <OrdersRing
            totalOrders={totalOrders}
            completedCount={completedCount}
            pendingCount={pendingCount}
          />
        </div>
      </div>

      <CakeChart orders={orders} />
    </div>
  );
}
