"use client";
import CircuitBackground from "./CircuitBackground";
import styles from "./FailedRegeneratedWebsite.module.css";

export default function FailedRegeneratedWebsite({
  errorReason,
  onTryAgain,
  isRetrying,
}: {
  errorReason: string | null;
  onTryAgain: () => void;
  isRetrying: boolean;
}) {
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
