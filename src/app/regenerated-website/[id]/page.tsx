"use client"
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import type { RegenerationStatus } from '../../../types/status';
import * as Ably from 'ably';

export default function RegeneratedWebsitePage() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<RegenerationStatus | null>(null);

  const ablyRef = useRef<Ably.Realtime | null>(null);
  const latestSeqRef = useRef<number>(-1);

  useEffect(() => {
    if (!id) return;

    const client = new Ably.Realtime({
      authUrl: '/api/ably-auth',
      autoConnect: true,
    });

    ablyRef.current = client;

    const channel = client.channels.get(`regeneration:${id}`);

    const handleStatusMessage = (msg: Ably.Message) => {
      console.log('New Ably message received:', msg);
      console.log('Message name:', msg.name);
      console.log('Message data:', msg.data);

      const payload = msg.data as RegenerationStatus;

      if ((payload.sequence ?? -1) <= latestSeqRef.current) {
        console.log('Ignored duplicate/out-of-order message:', payload);
        return;
      }

      latestSeqRef.current = payload.sequence ?? -1;
      setStatus(payload);
    };

    channel.subscribe('regeneration-status', handleStatusMessage);

    return () => {
      channel.unsubscribe('regeneration-status', handleStatusMessage);
      client.close();
      ablyRef.current = null;
    };
  }, [id]);

  return (
    <div>
        regen page
    </div>
  );
}
