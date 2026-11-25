import { promisify } from "node:util";
import { gunzip } from "node:zlib";
import { NextResponse } from "next/server";
import { z } from "zod";

const gunzipAsync = promisify(gunzip);

export type JsonRequestError = {
  ok: false;
  status: 400 | 415;
  message: string;
  issues?: z.core.$ZodIssue[];
};

export type ParseJsonRequestResult<T> = { ok: true; value: T } | JsonRequestError;

/**
 * Reads a JSON or gzip-compressed JSON request body and validates it with Zod.
 */
export async function parseJsonRequest<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<ParseJsonRequestResult<z.output<T>>> {
  const bodyResult = await readRequestBody(request);
  if (!bodyResult.ok) {
    return bodyResult;
  }

  let value: unknown;
  try {
    value = JSON.parse(bodyResult.body);
  } catch {
    return { ok: false, status: 400, message: "Invalid JSON request body" };
  }

  const result = schema.safeParse(value);
  if (!result.success) {
    return {
      ok: false,
      status: 400,
      message: "Invalid request payload",
      issues: result.error.issues,
    };
  }

  return { ok: true, value: result.data };
}

/**
 * Creates an error JSON response for an invalid request body or payload.
 */
export function jsonRequestErrorResponse(error: JsonRequestError): NextResponse {
  return NextResponse.json(
    { error: error.message, issues: error.issues },
    { status: error.status },
  );
}

async function readRequestBody(
  request: Request,
): Promise<{ ok: true; body: string } | { ok: false; status: 400 | 415; message: string }> {
  const body = Buffer.from(await request.arrayBuffer());
  const contentEncoding = request.headers.get("content-encoding")?.toLowerCase();

  if (!contentEncoding) {
    return { ok: true, body: body.toString("utf8") };
  }
  if (contentEncoding !== "gzip") {
    return {
      ok: false,
      status: 415,
      message: `Unsupported content encoding: ${contentEncoding}`,
    };
  }

  try {
    return { ok: true, body: (await gunzipAsync(body)).toString("utf8") };
  } catch {
    return { ok: false, status: 400, message: "Invalid gzip request body" };
  }
}
