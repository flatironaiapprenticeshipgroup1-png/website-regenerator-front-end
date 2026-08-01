"use client";
import Link from "next/link";
import CircuitBackground from "./CircuitBackground";
import styles from "./FailedRegeneratedWebsite.module.css";

const CSS_SIZE_LIMIT_PATTERN = /exceeds maximum allowed size of ([\d,]+) characters/i;

const EXAMPLE_SITES = [
  {
    url: "https://example.com",
    label: "example.com",
    description: "A tiny reference page — guaranteed to work.",
  },
  {
    url: "https://craigslist.org",
    label: "craigslist.org",
    description: "A well-known classifieds site with a famously lightweight design.",
  },
  {
    url: "https://text.npr.org",
    label: "text.npr.org",
    description: "NPR's minimal, text-only edition.",
  },
  {
    url: "https://danluu.com",
    label: "danluu.com",
    description: "A popular tech blog with a simple, minimal layout.",
  },
  {
    url: "http://info.cern.ch",
    label: "info.cern.ch",
    description: "The world's first website — about as simple as it gets.",
  },
];

function parseCssSizeLimitError(reason: string | null) {
  if (!reason) return null;
  const match = reason.match(CSS_SIZE_LIMIT_PATTERN);
  return match ? match[1] : null;
}

function formatDisplayUrl(url: string) {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export default function FailedRegeneratedWebsite({
  errorReason,
  websiteUrl,
  onTryAgain,
  isRetrying,
  retryError,
}: {
  errorReason: string | null;
  websiteUrl?: string | null;
  onTryAgain: () => void;
  isRetrying: boolean;
  retryError?: string | null;
}) {
  const maxChars = parseCssSizeLimitError(errorReason);

  if (maxChars) {
    return (
      <div className={styles.container}>
        <CircuitBackground />
        <div className={`${styles.card} ${styles.friendlyCard}`}>
          <div className={styles.iconWrapper}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="22" stroke="#f59e0b" strokeWidth="2" />
              <path d="M24 16v11" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M24 32h.01" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className={styles.heading}>
            {websiteUrl
              ? `The Website ${websiteUrl} Is Too Large For Regeneration`
              : "This Website Is Too Large For Regeneration"}
          </h2>
          <p className={styles.reason}>
            {websiteUrl ? <>{formatDisplayUrl(websiteUrl)}&apos;s</> : "This site's"} stylesheet is bigger than the {Number(maxChars.replace(/,/g, "")).toLocaleString()} character
            limit the regenerator currently supports. Regenerating a site utilizes an AI model that reads
            through every line of its HTML and CSS and regenerates both from scratch, so bigger
            stylesheets mean a lot more AI usage. To keep this tool fast, reliable, and free to
            run for everyone, we currently only regenerate smaller websites.
          </p>
          <div className={styles.examplesBlock}>
            <p className={styles.sectionLabel}>Here are some examples of smaller websites you can use for regeneration instead:</p>
            <ul className={styles.exampleList}>
              {EXAMPLE_SITES.map((site) => (
                <li key={site.url} className={styles.exampleItem}>
                  <Link
                    href={`/?url=${encodeURIComponent(site.url)}`}
                    className={styles.exampleLink}
                  >
                    {site.label}
                  </Link>
                  <span className={styles.exampleDescription}>{site.description}</span>
                </li>
              ))}
            </ul>
          </div>
          {retryError && <p className={styles.reason}>{retryError}</p>}
          <Link href="/" className={styles.button}>
            Regenerate a Different Website
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <CircuitBackground />
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <circle cx="24" cy="24" r="22" stroke="#ef4444" strokeWidth="2" />
            <path d="M24 14v13M24 33h.01" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className={styles.heading}>Regeneration Failed</h2>
        {errorReason && (
          <p className={styles.reason}>{errorReason}</p>
        )}
        {retryError && (
          <p className={styles.reason}>{retryError}</p>
        )}
        <button
          className={styles.button}
          onClick={onTryAgain}
          disabled={isRetrying}
        >
          {isRetrying ? "Retrying…" : "Try Again"}
        </button>
      </div>
    </div>
  );
}
