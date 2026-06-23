import RegeneratedWebsite from "@/types/regeneratedWebsite";
import { RegenerationStatus } from "@/types/status";
import styles from "./LoadingRegeneratedWebsite.module.css";
import CircuitBackground from "./CircuitBackground";
import { useEffect, useRef, useState } from "react";

export default function LoadingRegeneratedWebsite({
  setShowRegeneratedWebsite,
  status,
  regeneratedWebsiteRecord,
  recordLoaded,
  ablyMarkedComplete,
  progress,
  currentStep,
  htmlChunkProgress,
  cssChunkProgress,
}: {
  setShowRegeneratedWebsite: React.Dispatch<React.SetStateAction<boolean>>;
  status: RegenerationStatus | null;
  regeneratedWebsiteRecord: RegeneratedWebsite | null;
  recordLoaded: boolean;
  ablyMarkedComplete?: boolean;
  progress: number;
  currentStep: string;
  htmlChunkProgress?: number | null;
  cssChunkProgress?: number | null;
}) {
  const MIN_STEP_MS = 1500;
  const [displayedStep, setDisplayedStep] = useState(currentStep);
  const queueRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!currentStep || currentStep === displayedStep) return;
    queueRef.current.push(currentStep);
    if (timerRef.current) return;

    const drain = () => {
      const next = queueRef.current.shift();
      if (!next) { timerRef.current = null; return; }
      setDisplayedStep(next);
      timerRef.current = setTimeout(drain, MIN_STEP_MS);
    };
    drain();
  }, [currentStep]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

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
        {displayedStep && (
          <p key={displayedStep} className={styles.step}>{displayedStep}</p>
        )}
        {htmlChunkProgress !== null && htmlChunkProgress !== undefined && (
          <div key="html-chunk-bar" className={styles.subProgressGroup}>
            <p className={styles.subProgressLabel}>
              Html Regeneration
            </p>
            <div className={styles.subProgressTrack}>
              <div
                className={styles.subProgressFill}
                style={{ width: `${htmlChunkProgress}%` }}
              />
            </div>
            <p className={styles.subProgressLabel}>{htmlChunkProgress}%</p>
          </div>
        )}
        {cssChunkProgress !== null && cssChunkProgress !== undefined && (
          <div key="css-chunk-bar" className={styles.subProgressGroup}>
            <p className={styles.subProgressLabel}>
              Css Regeneration
            </p>
            <div className={styles.subProgressTrack}>
              <div
                className={styles.subProgressFill}
                style={{ width: `${cssChunkProgress}%` }}
              />
            </div>
            <p className={styles.subProgressLabel}>
              {cssChunkProgress}%
            </p>
          </div>
        )}
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <p className={styles.progressLabel}>{progress}%</p>
      </div>
    </div>
  );
}
