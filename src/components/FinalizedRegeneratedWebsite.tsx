"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function FinalizedRegeneratedWebsite({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const response = await fetch(
          `/api/get-regenerated-website?RegeneratedWebsiteId=${id}`,
        );
        if (!response.ok) {
          throw new Error(`Error fetching URL: ${response.statusText}`);
        }
        const data = await response.json();

        if (!data.ResultUrl) {
          throw new Error("Result URL not ready yet. Please try again later.");
        } else {
          setUrl(data.ResultUrl);
          setOriginalUrl(data.RegeneratedWebsiteUrl);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUrl();
  }, [id]);
  if (loading) {
    return <p>Loading...</p>;
  }
  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }
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
        {originalUrl && (
          <span style={{ fontSize: "14px", color: "#555" }}>
            Viewing : {originalUrl}
          </span>
        )}
      </nav>

      {/* Iframe - takes up most of the screen */}
      <iframe
        src={url || undefined}
        title="Regenerated Website"
        style={{ width: "100%", height: "80vh", border: "1px solid #ccc" }}
      />
    </div>
  );
}
