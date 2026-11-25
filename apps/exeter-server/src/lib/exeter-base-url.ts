import "server-only";

/**
 * Returns the canonical public Exeter URL used in generated embed snippets.
 */
export function getExeterBaseUrl(): string {
  const value = process.env.EXETER_BASE_URL?.trim();
  if (!value) {
    throw new Error("EXETER_BASE_URL is not set.");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("EXETER_BASE_URL must be an absolute URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("EXETER_BASE_URL must use HTTP or HTTPS.");
  }

  return url.toString().replace(/\/+$/, "");
}
