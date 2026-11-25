import type { ActionMessage, NotificationType } from "@kieler/klighd-core";
import { describe, expect, it, vi } from "vitest";
import { type KlighdReplay } from "@/lib/klighd/replay";
import { ReplayKlighdConnection } from "./replay-klighd-connection";

describe("ReplayKlighdConnection", () => {
  it("replays stored actions for the current request model action", async () => {
    const replay = createReplay();
    const connection = new ReplayKlighdConnection(replay);
    const handler = vi.fn();
    connection.onMessageReceived(handler);

    await connection.connect("ws://unused");
    await connection.initialize({});
    connection.sendMessage(requestModelAction("current-client", "current-request"));
    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenNthCalledWith(1, {
      clientId: "current-client",
      action: { kind: "setSyntheses", syntheses: [] },
    });
    expect(handler).toHaveBeenNthCalledWith(2, {
      clientId: "current-client",
      action: { kind: "setModel", responseId: "current-request", newRoot: { id: "root" } },
    });
    expect(replay.actions[1]?.clientId).toBe("captured-client");
  });

  it("ignores outgoing actions that are handled locally", () => {
    const connection = new ReplayKlighdConnection(createReplay());

    expect(() => connection.sendMessage({ clientId: "client", action: { kind: "elementSelected" } } as ActionMessage))
      .not.toThrow();
    expect(() => connection.sendNotification("keith/diagramOptions/setLayoutOptions" as NotificationType, {}))
      .toThrow("does not support");
  });
});

function createReplay(): KlighdReplay {
  return {
    formatVersion: 1,
    sourceUri: "file:///diagram.sctx",
    actions: [
      { clientId: "captured-client", action: { kind: "setSyntheses", syntheses: [] } },
      {
        clientId: "captured-client",
        action: { kind: "setModel", responseId: "captured-request", newRoot: { id: "root" } },
      },
    ],
  };
}

function requestModelAction(clientId: string, requestId: string): ActionMessage {
  return { clientId, action: { kind: "requestModel", requestId } } as ActionMessage;
}
