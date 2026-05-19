import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});

const QUEUE_URL = process.env.SQS_QUEUE_URL;

export async function POST(req: NextRequest) {
  const { url, regenerationTheme } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
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
      })
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to queue website regeneration" },
      { status: 500 }
    );
  }

  return NextResponse.json({ RegeneratedWebsiteId }, { status: 202 });
}
