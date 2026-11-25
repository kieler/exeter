import { describe, expect, it } from "vitest";
import { createKlighdReplay, type CapturedKlighdMessage } from "./index";

describe("createKlighdReplay", () => {
  it("retains only received diagram actions", () => {
    const replay = createKlighdReplay("file:///diagram.sctx", [
      message("sent", { method: "textDocument/didOpen" }),
      message("received", { method: "textDocument/publishDiagnostics" }),
      message("received", {
        method: "diagram/accept",
        params: { clientId: "capture", action: { kind: "setSyntheses", syntheses: [] } },
      }),
      message("received", {
        method: "diagram/accept",
        params: { clientId: "capture", action: { kind: "setModel", newRoot: { id: "root" } } },
      }),
    ]);

    expect(replay).toEqual({
      formatVersion: 1,
      sourceUri: "file:///diagram.sctx",
      actions: [
        { clientId: "capture", action: { kind: "setSyntheses", syntheses: [] } },
        { clientId: "capture", action: { kind: "setModel", newRoot: { id: "root" } } },
      ],
    });
  });

  it("rejects captures without a diagram model", () => {
    expect(() => createKlighdReplay("file:///diagram.sctx", [])).toThrow("did not return a diagram model");
  });
});

function message(
  direction: CapturedKlighdMessage["direction"],
  message: CapturedKlighdMessage["message"],
): CapturedKlighdMessage {
  return { direction, message };
}
