"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { strings } from "@/lib/strings";

const t = strings.auth;

function mapRegisterError(code: string | undefined): string {
  switch (code) {
    case "USER_ALREADY_EXISTS":
      return t.errors.emailTaken;
    case "PASSWORD_TOO_SHORT":
      return t.errors.passwordTooShort;
    case "INVALID_EMAIL":
      return t.errors.invalidEmail;
    default:
      return strings.common.genericError;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password.length < 10) {
      setError(t.errors.passwordTooShort);
      return;
    }
    setPending(true);
    const { error: apiError } = await authClient.signUp.email({
      name,
      email,
      password,
    });
    if (apiError) {
      setError(mapRegisterError(apiError.code));
      setPending(false);
      return;
    }
    router.push("/app");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="ornate-frame-sutil felt-texture w-full max-w-sm space-y-6 p-6">
        <h1 className="heading-gilded font-display text-2xl font-bold tracking-tight">
          {t.registerTitle}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              {t.nameLabel}
            </label>
            <Input
              id="name"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
              autoComplete="new-password"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="password-hint form-error"
            />
            <p id="password-hint" className="text-sm text-muted-foreground">
              {t.passwordHint}
            </p>
          </div>
          <div aria-live="polite">
            {error ? (
              <p id="form-error" className="text-sm text-danger-ink">
                {error}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t.registerPending : t.registerSubmit}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          {t.haveAccount}{" "}
          <Link href="/login" className="text-foreground underline">
            {t.loginTitle}
          </Link>
        </p>
      </div>
    </main>
  );
}
