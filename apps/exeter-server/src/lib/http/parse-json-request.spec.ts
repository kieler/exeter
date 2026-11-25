import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { jsonRequestErrorResponse, parseJsonRequest } from "./parse-json-request";

const PayloadSchema = z.object({ name: z.string() }).strict();

type InvalidRequestCase = {
  name: string;
  headers: Record<string, string>;
  body: string;
  status: 400 | 415;
  message: string;
};

describe("parseJsonRequest", () => {
  it("parses and validates a JSON request", async () => {
    const result = await parseJsonRequest(
      new Request("https://example.test", {
        method: "POST",
        body: JSON.stringify({ name: "Exeter" }),
      }),
      PayloadSchema,
    );

    expect(result).toEqual({ ok: true, value: { name: "Exeter" } });
  });

  it("parses gzip-compressed JSON", async () => {
    const result = await parseJsonRequest(
      new Request("https://example.test", {
        method: "POST",
        headers: { "content-encoding": "gzip" },
        body: gzipSync(JSON.stringify({ name: "Exeter" })),
      }),
      PayloadSchema,
    );

    expect(result).toEqual({ ok: true, value: { name: "Exeter" } });
  });

  const invalidRequestCases: InvalidRequestCase[] = [
    {
      name: "malformed JSON",
      headers: {},
      body: "{",
      status: 400,
      message: "Invalid JSON request body",
    },
    {
      name: "an invalid payload",
      headers: {},
      body: JSON.stringify({ unexpected: true }),
      status: 400,
      message: "Invalid request payload",
    },
    {
      name: "an unsupported content encoding",
      headers: { "content-encoding": "br" },
      body: JSON.stringify({ name: "Exeter" }),
      status: 415,
      message: "Unsupported content encoding: br",
    },
    {
      name: "invalid gzip data",
      headers: { "content-encoding": "gzip" },
      body: "not gzip",
      status: 400,
      message: "Invalid gzip request body",
    },
  ];

  it.each(invalidRequestCases)("reports $name", async ({ headers, body, status, message }) => {
    const result = await parseJsonRequest(
      new Request("https://example.test", { method: "POST", headers, body }),
      PayloadSchema,
    );

    expect(result).toMatchObject({ ok: false, status, message });
  });
});

describe("jsonRequestErrorResponse", () => {
  it("uses the supplied error status and payload", async () => {
    const response = jsonRequestErrorResponse({
      ok: false,
      status: 415,
      message: "Unsupported content encoding: br",
    });

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({
      error: "Unsupported content encoding: br",
    });
  });
});
