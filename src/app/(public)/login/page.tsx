"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { strings } from "@/lib/strings";

const t = strings.auth;

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ disabled?: string }>;
}) {
  const { disabled } = use(searchParams);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const { error: apiError } = await authClient.signIn.email({
      email,
      password,
    });
    if (apiError) {
      setError(
        apiError.status === 401
          ? t.errors.invalidCredentials
          : strings.common.genericError,
      );
      setPending(false);
      return;
    }
    router.push("/app");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="ornate-frame-sutil felt-texture w-full max-w-sm space-y-6 p-6">
        <h1 className="heading-gilded font-display text-2xl font-bold tracking-tight">
          {t.loginTitle}
        </h1>
        {disabled ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/40 bg-card p-3 text-sm"
          >
            {t.disabledNotice}
          </p>
        ) : null}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {t.emailLabel}
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              {t.passwordLabel}
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={error ? "form-error" : undefined}
            />
          </div>
          <div aria-live="polite">
            {error ? (
              <p id="form-error" className="text-sm text-danger-ink">
                {error}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t.loginPending : t.loginSubmit}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          {t.noAccount}{" "}
          <Link href="/register" className="text-foreground underline">
            {t.registerTitle}
          </Link>
        </p>
      </div>
    </main>
  );
}
