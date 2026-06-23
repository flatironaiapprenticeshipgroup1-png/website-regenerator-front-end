"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const linkStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.7)",
  fontSize: "13px",
  fontWeight: 500,
  padding: "7px 16px",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "6px",
  textDecoration: "none",
  background: "rgba(255,255,255,0.05)",
  transition: "background 0.15s",
};

export default function BottomNav({
  user,
}: {
  user: boolean;
}) {
  const pathname = usePathname();

  return (
    <>
      <div className="bottom-nav-trigger" />
      <nav
        className="bottom-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: "12px 24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(10,10,10,0.6)",
          backdropFilter: "blur(10px)",
        }}
      >
        {pathname !== "/" && (
          <Link href="/" style={linkStyle}>
            Home
          </Link>
        )}
        {user && pathname !== "/history" && (
          <Link href="/history" style={linkStyle}>
            History
          </Link>
        )}
        {user ? (
          <LogoutButton />
        ) : (
          pathname !== "/auth/login" && (
            <Link href="/auth/login" style={linkStyle}>
              Log in
            </Link>
          )
        )}
      </nav>
    </>
  );
}
