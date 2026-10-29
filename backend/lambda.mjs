import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({});

function respond(statusCode) {
  return {
    statusCode,
    headers: { "Cache-Control": "no-store" },
    body: "",
  };
}

function readHeaders(event) {
  return Object.fromEntries(
    Object.entries(event.headers || {}).map(([name, value]) => [
      name.toLowerCase(),
      value,
    ]),
  );
}

function readBody(event) {
  if (event.isBase64Encoded) {
    return Buffer.from(event.body || "", "base64").toString("utf8");
  }

  return event.body || "";
}

function validEventId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value || "",
  );
}

function getLocation(headers, name, pattern) {
  const value = headers[name] || "";
  return pattern.test(value) ? value : "unknown";
}

// API Gateway HTTP API, payload 2.0. Handler: lambda.handler.
export async function handler(event) {
  const headers = readHeaders(event);

  // Configure o mesmo valor secreto como custom origin header no CloudFront.
  if (
    !process.env.ORIGIN_VERIFY_SECRET ||
    headers["x-origin-verify"] !== process.env.ORIGIN_VERIFY_SECRET
  ) {
    return respond(403);
  }

  if (
    event.requestContext?.http?.method !== "POST" ||
    event.rawPath !== "/api/visits"
  ) {
    return respond(404);
  }

  let input;

  try {
    const body = readBody(event);
    if (Buffer.byteLength(body) > 2048) return respond(413);
    input = JSON.parse(body);
  } catch {
    return respond(400);
  }

  if (!input || typeof input !== "object" || !validEventId(input.eventId)) {
    return respond(400);
  }

  const source =
    typeof input.source === "string" &&
    /^(direct|[a-z0-9.-]{1,253})$/i.test(input.source)
      ? input.source
      : "unknown";

  const country = getLocation(
    headers,
    "cloudfront-viewer-country",
    /^[A-Z]{2}$/,
  );
  const region = getLocation(
    headers,
    "cloudfront-viewer-country-region",
    /^[A-Z0-9-]{1,3}$/,
  );
  const now = new Date();

  try {
    await db.send(
      new PutItemCommand({
        TableName: process.env.VISITS_TABLE,
        Item: {
          eventId: { S: input.eventId },
          visitedAt: { S: now.toISOString() },
          source: { S: source },
          country: { S: country },
          region: { S: region },
          expiresAt: {
            N: String(Math.floor(now.getTime() / 1000) + 30 * 86400),
          },
        },
        ConditionExpression: "attribute_not_exists(eventId)",
      }),
    );
    return respond(204);
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") return respond(204);
    // Não registrar evento, cabeçalhos, IP ou segredo nos logs.
    console.error("visit_write_failed");
    return respond(503);
  }
}
