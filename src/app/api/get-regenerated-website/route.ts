import { NextResponse, NextRequest } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("RegeneratedWebsiteId");
    if (!websiteId) {
      return NextResponse.json(
        { error: "RegeneratedWebsiteId query parameter is required" },
        { status: 400 },
      );
    }
    const result = await docClient.send(
      new QueryCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        KeyConditionExpression: "RegeneratedWebsiteId = :id",
        ExpressionAttributeValues: {
          ":id": websiteId,
        },
      }),
    );
    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json(
        { error: "No data found for the provided RegeneratedWebsiteId" },
        { status: 404 },
      );
    }
    return NextResponse.json(result.Items[0], { status: 200 });
  } catch (error) {
    console.error("Error fetching data from DynamoDB:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
