"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { RegenerationStatus } from "../../../types/status";
import * as Ably from "ably";
import RegeneratedWebsite from "@/types/regeneratedWebsite";
import LoadingRegeneratedWebsite from "@/components/LoadingRegeneratedWebsite";
import FinalizedRegeneratedWebsite from "@/components/FinalizedRegeneratedWebsite";
import FailedRegeneratedWebsite from "@/components/FailedRegeneratedWebsite";

type PageState = "loading" | "failed" | "completed";

const STEP_ORDER = [
  "received",
  "crawling_html",
  "extracting_css",
  "extracting_images",
  "queueing_ai",
  "chunking",
  "regenerating_combined",
  "regenerating_combined_chunks_completed",
  "Finalizing",
];

const COMBINED_REGEN_STEP = "regenerating_combined";
const COMBINED_CHUNK_STEP = "regenerating_combined_chunks_completed";
const COMBINED_CHUNK_STEP_INDEX = STEP_ORDER.indexOf(COMBINED_CHUNK_STEP);

function normalizeStep(step: string | null): string {
  if (!step) return "";

  if (
    step === "regenerating_html" ||
    step === "regenerating_css" ||
    step === "regenerating_website" ||
    step === "regenerating_html_css" ||
    step === "regenerating_combined"
  ) {
    return COMBINED_REGEN_STEP;
  }

  if (
    step === "regenerating_html_chunks_completed" ||
    step === "regenerating_css_chunks_completed" ||
    step === "regenerating_website_chunks_completed" ||
    step === "regenerating_html_css_chunks_completed" ||
    step === "regenerating_combined_chunks_completed"
  ) {
    return COMBINED_CHUNK_STEP;
  }

  return step;
}

export default function RegeneratedWebsitePage() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<RegenerationStatus | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [showFinalizedWebsite, setShowFinalizedWebsite] = useState(false);
  const [regeneratedWebsiteRecord, setRegeneratedWebsiteRecord] =
    useState<RegeneratedWebsite | null>(null);
  const [recordLoaded, setRecordLoaded] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [combinedChunkProgress, setCombinedChunkProgress] = useState<
    number | null
  >(null);

  const [retryError, setRetryError] = useState<string | null>(null);

  const ablyRef = useRef<Ably.Realtime | null>(null);
  const latestSeqRef = useRef<number>(-1);
  const seenCombinedChunksRef = useRef<Set<number>>(new Set());
  const maxProgressRef = useRef<number>(0);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const client = new Ably.Realtime({
      authUrl: "/api/ably-auth",
      autoConnect: true,
    });

    ablyRef.current = client;

    const channel = client.channels.get(`regeneration:${id}`);

    const handleStatusMessage = (msg: Ably.Message) => {
      const payload = msg.data as RegenerationStatus;

      if ((payload.sequence ?? -1) <= latestSeqRef.current) {
        return;
      }

      latestSeqRef.current = payload.sequence ?? -1;
      setStatus(payload);

      const chunkMatch = payload.message?.match(/(\d+) of (\d+)/i);
      const normalizedStep = normalizeStep(payload.step);
      const stepIndex = STEP_ORDER.indexOf(normalizedStep);

      if (stepIndex !== -1) {
        let stepFraction = 1;

        if (normalizedStep === COMBINED_CHUNK_STEP) {
          if (chunkMatch) {
            const chunkNum = parseInt(chunkMatch[1]);
            const total = parseInt(chunkMatch[2]);
            seenCombinedChunksRef.current.add(chunkNum);
            stepFraction =
              total > 0
                ? Math.min(seenCombinedChunksRef.current.size / total, 1)
                : 0;
          } else {
            stepFraction = 0;
          }
          const pct = Math.round(stepFraction * 100);
          setCombinedChunkProgress(pct);
          // currentStep is left untouched here — the sub-bar itself now shows
          // the percentage, so the step label just keeps showing whatever the
          // last non-chunked step's message was until the next one arrives.
        } else {
          if (payload.message) setCurrentStep(payload.message);
          // Show the sub-bar at 0% as soon as regeneration starts.
          if (normalizedStep === COMBINED_REGEN_STEP)
            setCombinedChunkProgress(0);
          // Once the pipeline has moved past chunked regeneration, hide the sub-bar.
          if (stepIndex > COMBINED_CHUNK_STEP_INDEX)
            setCombinedChunkProgress(null);
        }

        // Never let displayed progress move backwards — a step's fraction can
        // legitimately regress mid-step (e.g. a chunk-phase event arrives
        // without an "N of M" in its message), but the progress bar shouldn't.
        const nextProgress = Math.round(
          ((stepIndex + stepFraction) / STEP_ORDER.length) * 100,
        );
        const clampedProgress = Math.max(nextProgress, maxProgressRef.current);
        maxProgressRef.current = clampedProgress;
        setProgress(clampedProgress);
      }

      if (payload.status === "failed") {
        setPageState("failed");
      } else if (payload.status === "completed") {
        setPageState("completed");
      } else {
        setPageState("loading");
      }
    };

    // subscribe() returns a promise that resolves once the channel attaches.
    // In dev, React Strict Mode mounts this effect, cleans it up, then mounts
    // it again — if client.close() (below, in the cleanup) fires while this
    // first subscribe is still attaching, Ably rejects the pending promise
    // with a "Connection closed" error. That rejection is expected noise from
    // the unmount/remount race, not a real failure — the `cancelled` flag
    // (set in the cleanup below) tells us whether that's what happened. Any
    // rejection that arrives while the effect is still mounted is a genuine
    // failure (auth, rate limit, network) and should surface to the user
    // instead of leaving them on an infinite spinner.
    channel
      .subscribe("regeneration-status", handleStatusMessage)
      .catch((err) => {
        if (cancelled) return;
        console.error("Ably subscribe failed:", err);
        setPageState("failed");
        setStatus(
          (prev) =>
            prev ?? {
              websiteId: id,
              phase: null,
              step: null,
              status: "failed",
              sequence: null,
              resultUrl: null,
              error:
                "Lost connection for live updates. Please refresh the page.",
            },
        );
      });

    return () => {
      cancelled = true;
      channel.unsubscribe("regeneration-status", handleStatusMessage);
      client.close();
      ablyRef.current = null;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/get-regenerated-website?RegeneratedWebsiteId=${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: RegeneratedWebsite | null) => {
        if (data) {
          setRegeneratedWebsiteRecord(data);
          if (latestSeqRef.current === -1) {
            if (data.RegenerationStatus === "failed") {
              setPageState("failed");
            } else if (data.RegenerationStatus === "completed") {
              setPageState("completed");
            }
          }
        }
        setRecordLoaded(true);
      });
  }, [id]);

  const handleTryAgain = useCallback(async () => {
    const record = regeneratedWebsiteRecord;
    if (!record) return;

    setIsRetrying(true);
    setRetryError(null);
    try {
      const res = await fetch("/api/regenerate-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: record.RegeneratedWebsiteUrl,
          regenerationTheme: record.RegenerationTheme || undefined,
          RegeneratedWebsiteId: id,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setRetryError(
          data?.error || "Failed to start retry. Please try again.",
        );
        return;
      }

      latestSeqRef.current = -1;
      seenCombinedChunksRef.current = new Set();
      setCombinedChunkProgress(null);
      setProgress(0);
      maxProgressRef.current = 0;
      setCurrentStep("");
      setStatus(null);
      setPageState("loading");
      setShowFinalizedWebsite(false);
    } catch {
      setRetryError("Network error — please try again");
    } finally {
      setIsRetrying(false);
    }
  }, [id, regeneratedWebsiteRecord]);

  const errorReason =
    status?.error ?? regeneratedWebsiteRecord?.ErrorMessage ?? null;

  if (showFinalizedWebsite) {
    return (
      <FinalizedRegeneratedWebsite
        id={id}
        RegeneratedWebsiteRecord={regeneratedWebsiteRecord!}
      />
    );
  }

  if (pageState === "failed") {
    return (
      <FailedRegeneratedWebsite
        errorReason={errorReason}
        onTryAgain={handleTryAgain}
        isRetrying={isRetrying}
        retryError={retryError}
      />
    );
  }

  return (
    <div>
      <LoadingRegeneratedWebsite
        regeneratedWebsiteRecord={regeneratedWebsiteRecord}
        recordLoaded={recordLoaded}
        setShowRegeneratedWebsite={setShowFinalizedWebsite}
        status={status}
        progress={progress}
        currentStep={currentStep}
        combinedChunkProgress={combinedChunkProgress}
      />
    </div>
  );
}
