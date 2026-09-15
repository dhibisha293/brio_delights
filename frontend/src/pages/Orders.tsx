import { ShoppingCart } from "lucide-react";

export default function Orders() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-lav-900">Orders</h1>
        <p className="mt-2 text-lav-700">Track and manage your customer orders.</p>
      </div>

      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-lav-300 bg-white/50 p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lav-100 text-lav-500">
          <ShoppingCart className="h-8 w-8" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-lav-900">Order Management</h2>
        <p className="max-w-md text-lav-700">
          Order tracking will be added here. You'll be able to create new orders, track their status, and manage pickup or delivery times.
        </p>
      </div>
    </div>
  );
}
