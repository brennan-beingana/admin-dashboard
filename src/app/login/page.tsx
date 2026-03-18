"use client";

import { Suspense } from "react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAdmin, unwrapError } from "@/lib/api";
import { hasAdminToken, setAdminToken } from "@/lib/storage";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasAdminToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await loginAdmin({ email, password });
      setAdminToken(data.token);
      const next = searchParams.get("next") || "/dashboard";
      router.replace(next);
    } catch (submissionError) {
      setError(unwrapError(submissionError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-black/10 p-6">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        <p className="mt-1 text-sm text-foreground/70">Sign in to access the e-bike admin dashboard.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-black/15 px-3 py-2"
              placeholder="admin@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-black/15 px-3 py-2"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Loading login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
