import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Website Regenerator",
  description: "Regenerate websites with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {children}
        <nav style={{
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
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(10px)",
        }}>
          <Link href="/" style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: "13px",
            fontWeight: 500,
            padding: "7px 16px",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "6px",
            textDecoration: "none",
            background: "rgba(255,255,255,0.05)",
            transition: "background 0.15s",
          }}>
            Home
          </Link>
          <Link href="/history" style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: "13px",
            fontWeight: 500,
            padding: "7px 16px",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "6px",
            textDecoration: "none",
            background: "rgba(255,255,255,0.05)",
            transition: "background 0.15s",
          }}>
            History
          </Link>
          <LogoutButton />
        </nav>
      </body>
    </html>
  );
}
