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

  const ablyRef = useRef<Ably.Realtime | null>(null);
  const latestSeqRef = useRef<number>(-1);
  const seenChunksRef = useRef<Set<number>>(new Set());
  const totalChunksRef = useRef<number>(0);
  const inAiPhaseRef = useRef(false);

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

      if (payload.phase === 'crawler' && chunkMatch) {
        const chunkNum = parseInt(chunkMatch[1]);
        const total = parseInt(chunkMatch[2]);
        totalChunksRef.current = total;
        seenChunksRef.current.add(chunkNum);
        setProgress(Math.round((seenChunksRef.current.size / total) * 10));
      }

      if (payload.phase === 'ai') {
        if (!inAiPhaseRef.current) {
          inAiPhaseRef.current = true;
          seenChunksRef.current = new Set();
          totalChunksRef.current = 0;
          setProgress(10);
        }
        if (chunkMatch) {
          const chunkNum = parseInt(chunkMatch[1]);
          const total = parseInt(chunkMatch[2]);
          totalChunksRef.current = total;
          seenChunksRef.current.add(chunkNum);
          const pct = 10 + (seenChunksRef.current.size / total) * 90;
          setProgress(Math.round(pct));
        }
      }

      if (payload.status === "failed") {
        setPageState("failed");
      } else if (payload.status === "completed") {
        setPageState("completed");
      } else {
        setPageState("loading");
      }
    };

    channel.subscribe("regeneration-status", handleStatusMessage);

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
      seenChunksRef.current = new Set();
      totalChunksRef.current = 0;
      inAiPhaseRef.current = false;
      setProgress(0);
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
      />
    </div>
  );
}
