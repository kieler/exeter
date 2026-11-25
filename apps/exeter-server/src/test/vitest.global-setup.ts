import { spawn, type ChildProcess } from "node:child_process";
import { loadEnv } from "@/lib/env/load-env";

const DEFAULT_TEST_PORT = "3100";
const SERVER_START_TIMEOUT_MS = 30_000;

loadEnv("test");

export default async function setup() {
  if (process.env.TEST_BASE_URL) {
    return;
  }

  const port = process.env.TEST_PORT ?? DEFAULT_TEST_PORT;
  const baseUrl = `http://127.0.0.1:${port}`;

  process.env.TEST_BASE_URL = baseUrl;

  const server = spawn(
    "pnpm",
    ["exec", "next", "dev", "--hostname", "127.0.0.1", "--port", port],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "inherit", "inherit"],
    },
  );

  await waitForServer(baseUrl, server);

  return async () => {
    await stopServer(server);
  };
}

async function waitForServer(baseUrl: string, server: ChildProcess) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < SERVER_START_TIMEOUT_MS) {
    if (server.exitCode !== null) {
      throw new Error(`Next dev server exited before tests started with code ${server.exitCode}.`);
    }

    try {
      const response = await fetch(baseUrl);
      if (response.status < 500) {
        return;
      }
    } catch {
      // The server is still starting.
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for Next dev server at ${baseUrl}.`);
}

async function stopServer(server: ChildProcess) {
  if (server.exitCode !== null) {
    return;
  }

  server.kill("SIGTERM");

  await Promise.race([
    new Promise<void>((resolve) => server.once("exit", () => resolve())),
    delay(5_000).then(() => {
      if (server.exitCode === null) {
        server.kill("SIGKILL");
      }
    }),
  ]);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
