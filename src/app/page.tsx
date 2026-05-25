"use client";

import styles from "./page.module.css";
import CircuitBackground from "../components/CircuitBackground";
import * as Ably from 'ably';
import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import type { RegenerationStatus } from '../types/status';
import { useRouter } from "next/navigation";

export default function Home() {
  const [url, setUrl] = useState("");
  const [theme, setTheme] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

    /** Holds the active Ably.Realtime instance so the cleanup function can close it. */
  const ablyRef = useRef<Ably.Realtime | null>(null);

  /**
   * Tracks the highest sequence number seen so far for the current job.
   * Any incoming message with sequence ≤ this value is silently dropped,
   * preventing out-of-order or duplicate updates from overwriting newer state.
   */
  const latestSeqRef = useRef<number>(-1);

  function handleReset() {
    setStatus("idle");
    setUrl("");
    setTheme("");
    setJobId(null);
  }
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

  /**
   * Ably real-time subscription effect.
   *
   * Creates a new Ably.Realtime client authenticated via /api/ably-auth,
   * subscribes to the `regeneration-status` event on channel
   * `regeneration:<jobId>`, and applies incoming payloads subject to the
   * sequence-number guard.
   *
   * Cleanup: unsubscribes from the channel and closes the Ably connection
   * when `jobId` changes (i.e. a new job is started) or the component unmounts.
   */
  useEffect(() => {
    if (!jobId) return;

    const client = new Ably.Realtime({
      authUrl: '/api/ably-auth',
      autoConnect: true,
    });
    ablyRef.current = client;

    const channel = client.channels.get(`regeneration:${jobId}`);

    channel.subscribe('regeneration-status', (msg) => {
      const payload = msg.data as RegenerationStatus & { sequence: number };
      // Drop messages that arrived out of order or were duplicated.
      if (payload.sequence <= latestSeqRef.current) return;
      latestSeqRef.current = payload.sequence;
      setStatus(payload);
    });

    return () => {
      channel.unsubscribe();
      client.close();
      ablyRef.current = null;
    };
  }, [jobId]);

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
