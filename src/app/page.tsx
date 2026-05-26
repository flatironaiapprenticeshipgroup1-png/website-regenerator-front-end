"use client";

import styles from "./page.module.css";
import CircuitBackground from "../components/CircuitBackground";
import { useState } from 'react';
import { useRouter } from "next/navigation";

export default function Home() {
  const [url, setUrl] = useState("");
  const [theme, setTheme] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");


  const router = useRouter();

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/regenerate-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, regenerationTheme: theme || undefined }),
      });

      const data: {
        RegeneratedWebsiteId: string;
        RegeneratedWebsiteUrl: string;
        RegenerationTheme?: string;
        error?: string;
        message?: string;
      } = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong");
        setStatus("error");
        return;
      } else {
        setStatus("success");
        router.push(`/regenerated-website/${data.RegeneratedWebsiteId}`);
      }
    } catch (error) {
      setErrorMsg("Network error — please try again");
      setStatus("error");
    }
  }

  return (
    <>
      <CircuitBackground />
      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.badge}>AI-Powered</div>
            <h1 className={styles.title}>Website Regenerator</h1>
            <p className={styles.subtitle}>
              Transform any website with a new theme using generative AI
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="url">
                Website URL
              </label>
              <input
                id="url"
                className={styles.input}
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                disabled={status === "loading"}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="theme">
                Regeneration Theme <span className={styles.optional}>(optional)</span>
              </label>
              <input
                id="theme"
                className={styles.input}
                type="text"
                placeholder="e.g. cyberpunk, minimalist, retro 80s..."
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                disabled={status === "loading"}
              />
            </div>

            <button
              className={styles.button}
              type="submit"
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                <span className={styles.spinner} />
              ) : (
                "Regenerate Website"
              )}
            </button>
          </form>


          {status === "error" && (
            <div className={styles.errorBox}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 5v3M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p>{errorMsg}</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
