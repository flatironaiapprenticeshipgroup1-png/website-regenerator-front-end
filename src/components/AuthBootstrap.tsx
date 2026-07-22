"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ensureAnonymousSession } from "@/lib/supabase/ensureAnonymousSession";
import { isSignedOut } from "@/lib/supabase/signedOutFlag";

export default function AuthBootstrap() {
  const router = useRouter();

  useEffect(() => {
    if (isSignedOut()) return;
    ensureAnonymousSession().then(() => router.refresh());
  }, [router]);

  return null;
}
