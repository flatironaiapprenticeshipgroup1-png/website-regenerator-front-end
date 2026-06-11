import RegeneratedWebsite from "@/types/regeneratedWebsite";
import { RegenerationStatus } from "@/types/status";
import styles from "./LoadingRegeneratedWebsite.module.css";
import CircuitBackground from "./CircuitBackground";
import { useEffect, useRef, useState } from "react";

const MIN_STEP_MS = 1500;

export default function LoadingRegeneratedWebsite({
  currentStep,
  setShowRegeneratedWebsite,
  status,
  regeneratedWebsiteRecord,
  recordLoaded,
  ablyMarkedComplete,
}: {
  currentStep: string;
  setShowRegeneratedWebsite: React.Dispatch<React.SetStateAction<boolean>>;
  status: RegenerationStatus | null;
  regeneratedWebsiteRecord: RegeneratedWebsite | null;
  recordLoaded: boolean;
  ablyMarkedComplete: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fadingRef = useRef(false);

  const [displayedStep, setDisplayedStep] = useState(currentStep);
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!currentStep) return;
    queueRef.current.push(currentStep);
    if (processingRef.current) return;

    function advance() {
      if (queueRef.current.length === 0) {
        processingRef.current = false;
        return;
      }
      processingRef.current = true;
      const next = queueRef.current.shift()!;
      setDisplayedStep(next);
      timerRef.current = setTimeout(advance, MIN_STEP_MS);
    }

    advance();
  }, [currentStep]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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
        <p key={displayedStep} className={styles.step}>
          {displayedStep}
        </p>
        <div className={styles.dots}>
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
        </div>
      </div>
    </div>
  );
}
