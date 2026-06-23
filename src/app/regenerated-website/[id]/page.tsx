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
  "regenerating_html",
  "regenerating_html_chunks_completed",
  "queueing_ai",
  "chunking",
  "regenerating_css",
  "regenerating_css_chunks_completed",
  "Finalizing",
];

const HTML_REGEN_STEP = "regenerating_html";
const CSS_REGEN_STEP = "regenerating_css";
const HTML_CHUNK_STEP = "regenerating_html_chunks_completed";
const CSS_CHUNK_STEP = "regenerating_css_chunks_completed";
const HTML_CHUNK_STEP_INDEX = STEP_ORDER.indexOf(HTML_CHUNK_STEP);
const CSS_CHUNK_STEP_INDEX = STEP_ORDER.indexOf(CSS_CHUNK_STEP);

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
  const [htmlChunkProgress, setHtmlChunkProgress] = useState<number | null>(null);
  const [cssChunkProgress, setCssChunkProgress] = useState<number | null>(null);

  const ablyRef = useRef<Ably.Realtime | null>(null);
  const latestSeqRef = useRef<number>(-1);
  const seenHtmlChunksRef = useRef<Set<number>>(new Set());
  const seenCssChunksRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!id) return;

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
      const stepIndex = STEP_ORDER.indexOf(payload.step ?? "");

      if (stepIndex !== -1) {
        let stepFraction = 1;

        if (payload.step === HTML_CHUNK_STEP || payload.step === CSS_CHUNK_STEP) {
          const seenRef =
            payload.step === HTML_CHUNK_STEP ? seenHtmlChunksRef : seenCssChunksRef;
          if (chunkMatch) {
            const chunkNum = parseInt(chunkMatch[1]);
            const total = parseInt(chunkMatch[2]);
            seenRef.current.add(chunkNum);
            stepFraction = seenRef.current.size / total;
          } else {
            stepFraction = 0;
          }
          const pct = Math.round(stepFraction * 100);
          (payload.step === HTML_CHUNK_STEP ? setHtmlChunkProgress : setCssChunkProgress)(pct);
          // currentStep is left untouched here — the sub-bar itself now shows
          // the percentage, so the step label just keeps showing whatever the
          // last non-chunked step's message was until the next one arrives.
        } else {
          if (payload.message) setCurrentStep(payload.message);
          // Show each sub-bar at 0% as soon as its phase starts, rather than
          // waiting for the first chunk-completion event.
          if (payload.step === HTML_REGEN_STEP) setHtmlChunkProgress(0);
          if (payload.step === CSS_REGEN_STEP) setCssChunkProgress(0);
          // Once the pipeline has moved past a chunked step, hide its sub-bar —
          // not just when it reaches 100%, but the moment the *next* step's
          // event arrives.
          if (stepIndex > HTML_CHUNK_STEP_INDEX) setHtmlChunkProgress(null);
          if (stepIndex > CSS_CHUNK_STEP_INDEX) setCssChunkProgress(null);
        }

        setProgress(Math.round(((stepIndex + stepFraction) / STEP_ORDER.length) * 100));
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
    // with a "Connection closed" error. Left unhandled, that surfaces as an
    // unhandled-rejection runtime error in the Next.js dev overlay, even
    // though nothing is actually broken (the remounted effect creates a new
    // client and subscribes again). Swallow it here since it's expected noise
    // from the unmount/remount race, not a real failure.
    channel.subscribe("regeneration-status", handleStatusMessage).catch(() => {});

    return () => {
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
    try {
      await fetch("/api/regenerate-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: record.RegeneratedWebsiteUrl,
          regenerationTheme: record.RegenerationTheme || undefined,
          RegeneratedWebsiteId: id,
        }),
      });
      latestSeqRef.current = -1;
      seenHtmlChunksRef.current = new Set();
      seenCssChunksRef.current = new Set();
      setHtmlChunkProgress(null);
      setCssChunkProgress(null);
      setProgress(0);
      setCurrentStep("");
      setStatus(null);
      setPageState("loading");
      setShowFinalizedWebsite(false);
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
        htmlChunkProgress={htmlChunkProgress}
        cssChunkProgress={cssChunkProgress}
      />
    </div>
  );
}
