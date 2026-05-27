"use client";
import RegeneratedWebsite from "@/types/regeneratedWebsite";
import Link from "next/link";
import styles from "./FinalizedRegeneratedWebsite.module.css";

export default function FinalizedRegeneratedWebsite({
  id,
  RegeneratedWebsiteRecord,
}: {
  id: string;
  RegeneratedWebsiteRecord: RegeneratedWebsite;
}) {
  return (
    <div className={styles.wrapper}>
      {/*
       * navWrapper acts as the hover trigger zone.
       * Its ::before ghost gives it the same height as the nav bar,
       * so hovering the top ~48px of the page reveals the nav.
       * The nav itself is position:absolute and slides in from above.
       */}
      <div className={styles.navWrapper}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.backLink}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M8.5 2.5 L4 7 L8.5 11.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Regenerate Another Site
          </Link>

          {RegeneratedWebsiteRecord && (
            <span className={styles.urlBadge}>
              <span className={styles.urlBadgeDot} />
              {RegeneratedWebsiteRecord.RegeneratedWebsiteUrl}
            </span>
          )}
        </nav>
      </div>

      {/* Iframe — nav is fixed/out-of-flow so this fills 100vh */}
      <iframe
        src={`http://website-regeneration-s3-bucket.s3-website-us-east-1.amazonaws.com/${id}`}
        title="Regenerated Website"
        className={styles.iframe}
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
}
