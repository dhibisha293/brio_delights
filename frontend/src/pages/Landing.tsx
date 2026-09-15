import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-4 rounded-full bg-white/70 px-4 py-1 text-sm font-medium text-lav-700 shadow-sm">
        For home bakers who want to know the real profit
      </p>
      <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-lav-900 sm:text-6xl">
        Brio Delights
      </h1>
      <p className="mt-5 max-w-xl text-lg text-lav-800/80">
        Track what you buy, what you bake, and what you actually earn. Start with an account for
        your bakery.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/signup"
          className="rounded-full bg-lav-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-lav-500/30 transition hover:bg-lav-700"
        >
          Create account
        </Link>
        <Link
          to="/login"
          className="rounded-full bg-white/80 px-8 py-3 text-base font-semibold text-lav-800 ring-1 ring-lav-300 transition hover:bg-white"
        >
          Login
        </Link>
      </div>
    </main>
  );
}
