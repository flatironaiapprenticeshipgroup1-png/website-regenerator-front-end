import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import styles from "./history.module.css";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: regenerations } = await supabase
    .from("regenerations")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.badge}>Website Regenerator</div>
          <h1 className={styles.title}>History</h1>
        </div>

        {!user ? (
          <p className={styles.empty}>Please sign in to view your history.</p>
        ) : regenerations && regenerations.length > 0 ? (
          <ul className={styles.list}>
            {regenerations.map((regeneration) => (
              <li key={regeneration.id} className={styles.item}>
                <p className={styles.urlLabel}>URL</p>
                <p className={styles.url}>{regeneration.original_url}</p>
                <div className={styles.meta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Theme</span>
                    <span className={styles.metaValue}>
                      {regeneration.regeneration_theme || "None"}
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Date</span>
                    <span className={styles.metaValue}>
                      {new Date(regeneration.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/regenerated-website/${regeneration.regenerated_website_id}`}
                  className={styles.viewLink}
                >
                  View regeneration →
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>No regenerations yet.</p>
        )}
      </div>
    </div>
  );
}
