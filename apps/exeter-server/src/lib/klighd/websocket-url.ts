import "server-only";

/**
 * Reads the runtime URL used by browser-side KLighD connections.
 */
export function getKlighdWebsocketUrl(): string {
  const websocketUrl = process.env.KLIGHD_WEBSOCKET_URL;
  if (!websocketUrl) {
    throw new Error("KLIGHD_WEBSOCKET_URL must be configured.");
  }

  return websocketUrl;
}

/**
 * Returns the Websocket URL that needs to be used when connecting to the language server from
 * Exeter's server-side code.
 */
export function getKlighdServerWebsocketUrl(): string {
  const serverWebsocketUrl = process.env.KLIGHD_SERVER_WEBSOCKET_URL;
  if (!serverWebsocketUrl) {
    throw new Error("KLIGHD_SERVER_WEBSOCKET_URL must be configured.");
  }

  return serverWebsocketUrl;
}
