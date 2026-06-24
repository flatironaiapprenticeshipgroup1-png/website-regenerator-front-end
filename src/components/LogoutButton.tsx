"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        color: "rgba(255,100,100,0.8)",
        fontSize: "13px",
        fontWeight: 500,
        padding: "7px 16px",
        border: "1px solid rgba(255,100,100,0.25)",
        borderRadius: "6px",
        background: "rgba(255,100,100,0.06)",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      Log out
    </button>
  );
}
