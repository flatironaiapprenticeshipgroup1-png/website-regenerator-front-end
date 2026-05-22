import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { NextRequest, NextResponse } from 'next/server';

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'us-east-1' });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  const result = await dynamo.send(
    new QueryCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      KeyConditionExpression: 'RegeneratedWebsiteId = :id',
      ExpressionAttributeValues: { ':id': { S: id } },
      Limit: 1,
    }),
  );

  const item = result.Items?.[0];
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    websiteId: item.RegeneratedWebsiteId?.S,
    phase: item.CurrentPhase?.S ?? null,
    step: item.CurrentStep?.S ?? null,
    status: item.RegenerationStatus?.S ?? null,
    sequence: item.CurrentSequence?.N ? Number(item.CurrentSequence.N) : null,
    lastUpdatedAt: item.LastUpdatedAt?.S ?? null,
    resultUrl: item.ResultUrl?.S ?? null,
    error: item.ErrorMessage?.S ?? null,
  });
}
