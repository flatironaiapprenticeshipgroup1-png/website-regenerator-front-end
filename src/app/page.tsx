'use client';

/**
 * Home page — Website Regenerator
 *
 * Renders a two-panel UI:
 *   1. Job submission form  — collects a target URL and an optional theme string,
 *      then POSTs to /api/regenerate-website.
 *   2. Status panel          — shown after a job is submitted; displays live
 *      progress updates received over Ably (channel `regeneration:<jobId>`,
 *      event `regeneration-status`) and a one-time DynamoDB snapshot polled
 *      from /api/regenerate-website/<jobId> on mount.
 *
 * Out-of-order Ably messages are discarded via a monotonically-increasing
 * sequence number tracked in `latestSeqRef`.
 */

import * as Ably from 'ably';
import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import type { RegenerationStatus } from '../types/status';

/**
 * Human-readable labels for each processing step reported by the backend.
 * Keys match the `step` field on {@link RegenerationStatus}.
 */
const STEP_LABELS: Record<string, string> = {
  received: 'Request received',
  crawling_html: 'Crawling HTML',
  extracting_css: 'Extracting CSS',
  saving_original_assets: 'Saving original assets',
  saving_metadata: 'Saving metadata',
  queueing_ai: 'Queuing AI step',
  reading_source_css: 'Reading source CSS',
  building_prompt: 'Building AI prompt',
  calling_openai: 'Calling OpenAI',
  saving_regenerated_css: 'Saving regenerated CSS',
  completed: 'Complete',
  failed: 'Failed',
};

export default function Home() {
  /** Target website URL entered by the user. */
  const [url, setUrl] = useState('');

  /** Optional regeneration theme (e.g. "dark", "minimalist"). */
  const [theme, setTheme] = useState('');

  /**
   * ID returned by /api/regenerate-website after a successful POST.
   * Doubles as the key that drives both useEffect hooks below.
   */
  const [jobId, setJobId] = useState<string | null>(null);

  /** Latest status snapshot — updated by DynamoDB poll and Ably messages. */
  const [status, setStatus] = useState<RegenerationStatus | null>(null);

  /** True while the POST /api/regenerate-website request is in-flight. */
  const [submitting, setSubmitting] = useState(false);

  /** Non-null when the submission API returns an error. */
  const [formError, setFormError] = useState<string | null>(null);

  /** Holds the active Ably.Realtime instance so the cleanup function can close it. */
  const ablyRef = useRef<Ably.Realtime | null>(null);

  /**
   * Tracks the highest sequence number seen so far for the current job.
   * Any incoming message with sequence ≤ this value is silently dropped,
   * preventing out-of-order or duplicate updates from overwriting newer state.
   */
  const latestSeqRef = useRef<number>(-1);

  /**
   * Form submit handler.
   * Resets all job-related state, POSTs the URL + theme to the backend,
   * and stores the returned job ID to trigger the two useEffect hooks.
   */
  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    setStatus(null);
    setJobId(null);
    latestSeqRef.current = -1;

    try {
      const res = await fetch('/api/regenerate-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, regenerationTheme: theme || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error ?? 'Submission failed');
        return;
      }
      const data = await res.json();
      setJobId(data.RegeneratedWebsiteId);
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * DynamoDB snapshot effect.
   *
   * Fires once whenever `jobId` changes to a non-null value.
   * Fetches the current status from /api/regenerate-website/<jobId> (backed by
   * DynamoDB) and applies it if its sequence number is newer than anything
   * already stored — this pre-populates the panel before the first Ably event.
   */
  useEffect(() => {
    if (!jobId) return;

    fetch(`/api/regenerate-website/${jobId}`)
      .then((r) => r.json())
      .then((data: RegenerationStatus) => {
        if (data.sequence !== null && data.sequence > latestSeqRef.current) {
          latestSeqRef.current = data.sequence;
          setStatus(data);
        }
      })
      .catch(() => {});
  }, [jobId]);

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

  /** Resolved human-readable label for the current step, or null if unknown. */
  const stepLabel = status?.step ? (STEP_LABELS[status.step] ?? status.step) : null;

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Website Regenerator</h1>

      {/* ── Job submission form ── shown until a job ID is obtained */}
      {!jobId && (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              Website URL
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              Theme (optional)
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. dark, minimalist, neon"
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              />
            </label>
          </div>
          {formError && <p style={{ color: 'red' }}>{formError}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Regenerate'}
          </button>
        </form>
      )}

      {/* ── Status panel ── shown while a job is active */}
      {jobId && (
        <section style={{ marginTop: '2rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#666' }}>Job ID: {jobId}</p>

          {/* No status yet — waiting for first DynamoDB snapshot or Ably event */}
          {!status && <p>Waiting for first update…</p>}

          {/* In-progress: show phase and step */}
          {status && status.status !== 'completed' && status.status !== 'failed' && (
            <div>
              <p>Phase: <strong>{status.phase}</strong></p>
              <p>Step: <strong>{stepLabel}</strong></p>
              {status.message && <p>{status.message}</p>}
            </div>
          )}

          {/* Terminal state: failed */}
          {status?.status === 'failed' && (
            <div style={{ color: 'red' }}>
              <p>Regeneration failed at step: <strong>{stepLabel}</strong></p>
              {status.error && <p>Error: {status.error}</p>}
            </div>
          )}

          {/* Terminal state: completed with a result URL — show inline preview */}
          {status?.status === 'completed' && status.resultUrl && (
            <div>
              <p style={{ color: 'green' }}>Regeneration complete!</p>
              <iframe
                src={status.resultUrl}
                title="Regenerated website"
                style={{ width: '100%', height: 600, border: '1px solid #ccc', marginTop: '1rem' }}
              />
              <a href={status.resultUrl} target="_blank" rel="noreferrer">
                Open in new tab
              </a>
            </div>
          )}

          {/* Terminal state: completed but no result URL available */}
          {status?.status === 'completed' && !status.resultUrl && (
            <p style={{ color: 'green' }}>Regeneration complete! (No result URL available.)</p>
          )}

          {/* Reset button — clears jobId/status so the form re-appears */}
          <button style={{ marginTop: '1rem' }} onClick={() => { setJobId(null); setStatus(null); }}>
            Start a new job
          </button>
        </section>
      )}
    </main>
  );
}
