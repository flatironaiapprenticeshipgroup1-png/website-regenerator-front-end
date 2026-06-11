import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@/lib/supabase/service";

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});

const QUEUE_URL = process.env.SQS_QUEUE_URL;

export async function POST(req: NextRequest) {
  const { url, regenerationTheme } = await req.json();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: "url is not a valid URL" },
      { status: 400 },
    );
  }

  if (!QUEUE_URL) {
    return NextResponse.json(
      { error: "SQS queue URL is not configured" },
      { status: 500 },
    );
  }

  const RegeneratedWebsiteId = randomUUID();

  const messageBody = JSON.stringify({
    RegeneratedWebsiteId,
    RegeneratedWebsiteUrl: url,
    ...(regenerationTheme && { RegenerationTheme: regenerationTheme }),
  });

  try {
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: messageBody,
        MessageGroupId: "regenerate-website-group",
        MessageDeduplicationId: RegeneratedWebsiteId,
      }),
    );
    const serviceSupabase = createServiceClient();
    await serviceSupabase.from("regenerations").insert({
      user_id: user.id,
      original_url: url,
      regenerated_website_id: RegeneratedWebsiteId,
      regeneration_theme: regenerationTheme,
    });
    return NextResponse.json(
      {
        RegeneratedWebsiteId,
        RegeneratedWebsiteUrl: url,
        RegenerationTheme: regenerationTheme,
      },
      { status: 202 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to queue website regeneration", details: message },
      { status: 500 },
    );
  }
}
