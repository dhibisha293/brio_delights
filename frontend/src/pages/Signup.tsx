import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Signup() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [bakeryName, setBakeryName] = useState("");
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
      await signup({
        email,
        password,
        display_name: displayName,
        bakery_name: bakeryName,
      });
      navigate("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-bold text-lav-900">Create your bakery</h1>
      <p className="mt-2 text-lav-800/80">A few details so we can keep your numbers in one place.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-3xl bg-white/80 p-6 shadow-xl shadow-lav-300/40 ring-1 ring-lav-200">
        <Field label="Your name" value={displayName} onChange={setDisplayName} />
        <Field label="Bakery name" value={bakeryName} onChange={setBakeryName} />
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={password} onChange={setPassword} />
        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-lav-600 py-3 font-semibold text-white hover:bg-lav-700 disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-lav-800">
        Already have an account?{" "}
        <Link className="font-semibold underline" to="/login">
          Login
        </Link>
      </p>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-left text-sm font-medium text-lav-900">
      {label}
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-lav-200 bg-lav-50 px-4 py-3 text-base text-lav-900 outline-none ring-lav-400 focus:ring-2"
      />
    </label>
  );
}
