"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CircuitBackground from "@/components/CircuitBackground";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"password" | "anonymous" | null>(
    null,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting("password");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setSubmitting(null);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleAnonymousSignIn() {
    setError(null);
    setSubmitting("anonymous");

    const supabase = createClient();
    const { error } = await supabase.auth.signInAnonymously();

    setSubmitting(null);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <>
      <CircuitBackground />
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.badge}>Website Regenerator</div>
            <h1 className={styles.title}>Sign in</h1>
            <p className={styles.subtitle}>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className={styles.submit}
              disabled={submitting !== null}
            >
              {submitting === "password" ? "Signing in..." : "Sign in"}
            </button>

            <div className={styles.divider}>
              <span>or</span>
            </div>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleAnonymousSignIn}
              disabled={submitting !== null}
            >
              {submitting === "anonymous"
                ? "Continuing as guest..."
                : "Continue as guest"}
            </button>

            <p className={styles.footer}>
              Don&apos;t have an account? Want to see past regenerations?{" "}
              <Link href="/auth/register" className={styles.link}>
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
