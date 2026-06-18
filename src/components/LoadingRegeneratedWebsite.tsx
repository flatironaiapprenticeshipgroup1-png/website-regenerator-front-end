import RegeneratedWebsite from "@/types/regeneratedWebsite";
import { RegenerationStatus } from "@/types/status";
import styles from "./LoadingRegeneratedWebsite.module.css";
import CircuitBackground from "./CircuitBackground";
import { useEffect, useRef } from "react";

export default function LoadingRegeneratedWebsite({
  setShowRegeneratedWebsite,
  status,
  regeneratedWebsiteRecord,
  recordLoaded,
  ablyMarkedComplete,
  progress,
}: {
  setShowRegeneratedWebsite: React.Dispatch<React.SetStateAction<boolean>>;
  status: RegenerationStatus | null;
  regeneratedWebsiteRecord: RegeneratedWebsite | null;
  recordLoaded: boolean;
  ablyMarkedComplete?: boolean;
  progress: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fadingRef = useRef(false);

  useEffect(() => {
    const isComplete =
      ablyMarkedComplete ||
      status?.status === "completed" ||
      regeneratedWebsiteRecord?.RegenerationStatus === "completed";

    if (isComplete && !fadingRef.current && containerRef.current) {
      fadingRef.current = true;
      containerRef.current.classList.add(styles.fadeOut);
    }
  }, [status, regeneratedWebsiteRecord, ablyMarkedComplete]);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setShowRegeneratedWebsite(true);
      }}
    >
      <CircuitBackground />
      <div className={styles.spinnerWrapper}>
        <div className={styles.ring3} />
        <div className={styles.ring} />
        <div className={styles.ring2} />
        <div className={styles.orb} />
      </div>

      <div className={styles.textGroup}>
        {recordLoaded &&
        regeneratedWebsiteRecord?.RegenerationStatus !== "completed" ? (
          <h2 className={styles.title}>Regenerating Website</h2>
        ) : (
          <></>
        )}
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <p className={styles.progressLabel}>{progress}%</p>
      </div>
    </div>
  );
}
