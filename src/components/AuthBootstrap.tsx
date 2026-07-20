"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ensureAnonymousSession } from "@/lib/supabase/ensureAnonymousSession";

export default function AuthBootstrap() {
  const router = useRouter();

  useEffect(() => {
    ensureAnonymousSession().then(() => router.refresh());
  }, [router]);

  return null;
}
