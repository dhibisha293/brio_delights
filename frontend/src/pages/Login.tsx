import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/home" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-bold text-lav-900">Welcome back</h1>
      <p className="mt-2 text-lav-800/80">Log in to see your bakery.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-3xl bg-white/80 p-6 shadow-xl shadow-lav-300/40 ring-1 ring-lav-200">
        <label className="block text-sm font-medium text-lav-900">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-lav-200 bg-lav-50 px-4 py-3 outline-none ring-lav-400 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-lav-900">
          Password
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-lav-200 bg-lav-50 px-4 py-3 outline-none ring-lav-400 focus:ring-2"
          />
        </label>
        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-lav-600 py-3 font-semibold text-white hover:bg-lav-700 disabled:opacity-60"
        >
          {busy ? "Logging in…" : "Login"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-lav-800">
        New here?{" "}
        <Link className="font-semibold underline" to="/signup">
          Create account
        </Link>
      </p>
    </main>
  );
}
