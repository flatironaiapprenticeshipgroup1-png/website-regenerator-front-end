import FinalizedRegeneratedWebsite from "@/components/FinalizedRegeneratedWebsite";

interface PageProps {
  params: Promise<{ RegeneratedWebsiteId: string }>;
}

export default async function RegeneratedWebsitePage({ params }: PageProps) {
  const { RegeneratedWebsiteId } = await params;

  return (
    <div>
      <FinalizedRegeneratedWebsite id={RegeneratedWebsiteId} />
    </div>
  );
}
