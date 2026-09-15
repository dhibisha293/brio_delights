import { CreditCard } from "lucide-react";

export default function Expenses() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-lav-900">Expenses</h1>
        <p className="mt-2 text-lav-700">Track your bakery's non-ingredient expenses.</p>
      </div>

      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-lav-300 bg-white/50 p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lav-100 text-lav-500">
          <CreditCard className="h-8 w-8" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-lav-900">Expense Tracking</h2>
        <p className="max-w-md text-lav-700">
          Expense tracking will be added here. You'll be able to log packaging, marketing, delivery, and other business expenses to accurately calculate profit.
        </p>
      </div>
    </div>
  );
}
