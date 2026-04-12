"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setPending(false);

    if (!result || result.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute -left-24 -top-16 h-72 w-72 rounded-full bg-accentBlue/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-12 h-80 w-80 rounded-full bg-accentTeal/15 blur-3xl" />

      <section className="glass-card w-full max-w-md p-8 shadow-glow animate-fade-slide-up">
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Secure Access</p>
        <h1 className="mt-2 text-2xl font-semibold text-textPrimary">Sign In</h1>
        <p className="mt-2 text-sm text-muted">Use your dashboard credentials to continue.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Email</span>
            <div className="glass-card flex items-center gap-2 px-3 py-2">
              <Mail size={16} className="text-muted" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent text-textPrimary outline-none"
                required
              />
            </div>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-muted">Password</span>
            <div className="glass-card flex items-center gap-2 px-3 py-2">
              <Lock size={16} className="text-muted" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent text-textPrimary outline-none"
                required
              />
            </div>
          </label>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-accentBlue px-4 py-2 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}
