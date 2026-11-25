import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getKlighdWebsocketUrl } from "@/lib/klighd/websocket-url";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

/** Reports the availability of Exeter's directly connected services and storage. */
export async function GET() {
  if (!await getUser()) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const [disk, database, languageServer] = await Promise.all([
    diskUsage(),
    isDatabaseReachable(),
    isLanguageServerReachable(),
  ]);

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    memory: {
      used: os.totalmem() - os.freemem(),
      total: os.totalmem(),
    },
    disk,
    database,
    languageServer,
  }, { headers: { "Cache-Control": "no-store" } });
}

async function diskUsage(): Promise<{ available: number; total: number } | null> {
  try {
    const { stdout } = await withTimeout(execFileAsync("df", ["-Pk", process.cwd()]));
    const columns = String(stdout).trim().split("\n").at(-1)?.trim().split(/\s+/);
    if (!columns) return null;
    return {
      available: Number(columns[3]) * 1024,
      total: Number(columns[1]) * 1024,
    };
  } catch {
    return null;
  }
}

async function isDatabaseReachable(): Promise<boolean> {
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}

async function isLanguageServerReachable(): Promise<boolean> {
  try {
    const response = await withTimeout(fetch(getLanguageServerHealthUrl(), { cache: "no-store" }));
    return response.ok;
  } catch {
    return false;
  }
}

function getLanguageServerHealthUrl(): URL {
  const configuredUrl = process.env.KLIGHD_HEALTH_URL;
  if (configuredUrl) return new URL(configuredUrl);

  const websocketUrl = new URL(getKlighdWebsocketUrl());
  websocketUrl.protocol = websocketUrl.protocol === "wss:" ? "https:" : "http:";
  websocketUrl.pathname = "/health";
  websocketUrl.search = "";
  return websocketUrl;
}

async function withTimeout<Value>(promise: Promise<Value>): Promise<Value> {
  return await Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Health check timed out.")), 1_000)),
  ]);
}
