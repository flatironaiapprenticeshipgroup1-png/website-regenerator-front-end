import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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
    <div>
      <h1 className="mb-4 text-2xl font-bold">Regeneration History</h1>
      {!user ? (
        <p>Please log in to view your regeneration history.</p>
      ) : regenerations && regenerations.length > 0 ? (
        <ul className="space-y-4">
          {regenerations.map((regeneration) => (
            <li key={regeneration.id} className="rounded border p-4">
              <p>
                <strong>Original URL:</strong> {regeneration.original_url}
              </p>
              <Link
                href={`/regenerated-website/${regeneration.regenerated_website_id}`}
                className="text-blue-500 hover:underline"
              >
                View Regenerated Website
              </Link>
              <p>
                <strong>Regeneration Theme:</strong>{" "}
                {regeneration.regeneration_theme || "N/A"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(regeneration.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No regenerations found.</p>
      )}
    </div>
  );
}
