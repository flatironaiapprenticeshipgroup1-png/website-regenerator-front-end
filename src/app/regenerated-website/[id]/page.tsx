"use client"
import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import type { RegenerationStatus } from '../../../types/status';
import * as Ably from 'ably';

export default function regeneratedWebsitePage(
) {

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [websiteRegenerationId, setWebsiteRegenerationId] = useState<string | null>(null);

  
  /** Holds the active Ably.Realtime instance so the cleanup function can close it. */
  const ablyRef = useRef<Ably.Realtime | null>(null);

  /**
   * Tracks the highest sequence number seen so far for the current job.
   * Any incoming message with sequence ≤ this value is silently dropped,
   * preventing out-of-order or duplicate updates from overwriting newer state.
   */
  const latestSeqRef = useRef<number>(-1);

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
  if (!websiteRegenerationId) return;

  const client = new Ably.Realtime({
    authUrl: '/api/ably-auth',
    autoConnect: true,
  });

  ablyRef.current = client;

  const channel = client.channels.get(
    `regeneration:${websiteRegenerationId}`
  );

  const handleStatusMessage = (msg: Ably.Message) => {
    console.log('New Ably message received:', msg);
    console.log('Message name:', msg.name);
    console.log('Message data:', msg.data);

    const payload = msg.data as RegenerationStatus & { sequence: number };

    // Drop messages that arrived out of order or were duplicated.
    if (payload.sequence <= latestSeqRef.current) {
      console.log('Ignored duplicate/out-of-order message:', payload);
      return;
    }

    latestSeqRef.current = payload.sequence;
    setStatus(payload);
  };

  channel.subscribe('regeneration-status', handleStatusMessage);

  return () => {
    channel.unsubscribe('regeneration-status', handleStatusMessage);
    client.close();
    ablyRef.current = null;
  };
}, [websiteRegenerationId]);;

  return (
    <div>
        regen oage
    </div>
  );
}