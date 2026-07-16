"use client";

import { Suspense } from "react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAdmin, unwrapError } from "@/lib/api";
import { hasAdminToken, setAdminToken } from "@/lib/storage";
import { BrandLogo } from "@/components/brand-logo";

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
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex justify-center">
          <BrandLogo size={44} subtitle="Operations dashboard" />
        </div>
        <h1 className="text-xl font-semibold">Admin Login</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Sign in to access the eBike admin dashboard.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field w-full"
              placeholder="admin@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field w-full"
            />
          </label>

          {error ? <p className="alert-error">{error}</p> : null}

          <button type="submit" disabled={loading} className="btn-primary w-full">
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
