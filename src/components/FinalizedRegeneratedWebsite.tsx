"use client";
import RegeneratedWebsite from "@/types/regeneratedWebsite";
import Link from "next/link";

export default function FinalizedRegeneratedWebsite({
  id,
  RegneratedWebsiteRecord,
}: {
  id: string;
  RegneratedWebsiteRecord: RegeneratedWebsite;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        height: "100vh",
      }}
    >
      {/* Nav bar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px",
          width: "100%",
        }}
      >
        {/* left - back link */}
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "#0070f3",
            fontWeight: "bold",
          }}
        >
          &larr; Regenerate Another Site
        </Link>
        {/* Right - original URL */}
        {RegneratedWebsiteRecord && (
          <span style={{ fontSize: "14px", color: "#555" }}>
            Viewing: {RegneratedWebsiteRecord.RegeneratedWebsiteUrl}
          </span>
        )}
      </nav>

      {/* Iframe - takes up most of the screen */}
      <iframe
        src={`${process.env.S3_WEBSITE_URL}${id}`}
        title="Regenerated Website"
        style={{ width: "100%", flex: "1", border: "1px solid #ccc" }}
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
}
