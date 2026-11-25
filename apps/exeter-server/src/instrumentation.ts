import { PHASE_PRODUCTION_BUILD } from "next/constants";

/**
 * This startup hook is automatically called by NextJS whenever the server application starts.
 * We use it to create an administrator account, if no users exist yet for the installation.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD) {
    const { initializeAdmin } = await import("@/lib/auth/users");
    await initializeAdmin();
  }
}
