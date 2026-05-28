"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { RegenerationStatus } from "../../../types/status";
import * as Ably from "ably";
import RegeneratedWebsite from "@/types/regeneratedWebsite";
import LoadingRegeneratedWebsite from "@/components/LoadingRegeneratedWebsite";
import FinalizedRegeneratedWebsite from "@/components/FinalizedRegeneratedWebsite";

export default function RegeneratedWebsitePage() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<RegenerationStatus | null>(null);
  const [showRegeneratedWebsite, setShowRegeneratedWebsite] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>("");
  const [regeneratedWebsiteRecord, setRegeneratedWebsiteRecord] =
    useState<RegeneratedWebsite | null>(null);
  const [recordLoaded, setRecordLoaded] = useState(false);

  const ablyRef = useRef<Ably.Realtime | null>(null);
  const latestSeqRef = useRef<number>(-1);

  useEffect(() => {
    if (!id) return;

    const client = new Ably.Realtime({
      authUrl: "/api/ably-auth",
      autoConnect: true,
    });

    ablyRef.current = client;

    const channel = client.channels.get(`regeneration:${id}`);

    const handleStatusMessage = (msg: Ably.Message) => {
      console.log("New Ably message received:", msg);
      console.log("Message name:", msg.name);
      console.log("Message data:", msg.data);

      const payload = msg.data as RegenerationStatus;

      if ((payload.sequence ?? -1) <= latestSeqRef.current) {
        console.log("Ignored duplicate/out-of-order message:", payload);
        return;
      }

      latestSeqRef.current = payload.sequence ?? -1;
      setStatus(payload);
      setCurrentStep(payload.message as string);
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

    async function fetchRegeneratedWebsite() {
      fetch(`/api/get-regenerated-website?RegeneratedWebsiteId=${id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          console.log("data", data);
          if (data) setRegeneratedWebsiteRecord(data);
          setRecordLoaded(true);
        });
    }

    fetchRegeneratedWebsite();
  }, [id]);

  console.log(regeneratedWebsiteRecord);
  if (showRegeneratedWebsite) {
    return (
    
    <FinalizedRegeneratedWebsite id={id} RegeneratedWebsiteRecord={regeneratedWebsiteRecord!} />
  
  )
  } else {
    return (
      <div>
        <LoadingRegeneratedWebsite
          regeneratedWebsiteRecord={regeneratedWebsiteRecord}
          recordLoaded={recordLoaded}
          setShowRegeneratedWebsite={setShowRegeneratedWebsite}
          currentStep={currentStep ?? ""}
          status={status}
        />
      </div>
    );
  }


}
