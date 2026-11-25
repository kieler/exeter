import "reflect-metadata";
import type { ModelSource } from "@/lib/models";
import {
  JsonRpcKlighdConnection,
  type JsonRpcMessage,
} from "@/lib/klighd/connection/json-rpc-klighd-connection";
import { NodeTransport } from "@/lib/klighd/connection/transport/node.transport";
import {
  ObservableTransport,
  type TransportMessageDirection,
} from "@/lib/klighd/connection/transport/observable.transport";
import { runKlighdSession } from "./klighd-session";
import { withSandboxedDom } from "./sandbox";
import { isJsonObject, type JsonObject, type JsonValue, type KlighdReplay } from "@/lib/klighd/replay";

export interface CapturedKlighdMessage {
  direction: TransportMessageDirection;
  message: JsonRpcMessage;
}

/**
 * Generates one KLighD diagram through the language server and returns its replay payload.
 */
export async function captureKlighdDiagram(
  source: ModelSource,
  synthesisOptions: Readonly<Record<string, JsonValue>> = {},
): Promise<KlighdReplay> {
  return withSandboxedDom(async (sandbox) => {
    const messages: CapturedKlighdMessage[] = [];

    const transport = new ObservableTransport(new NodeTransport(), (direction, rawMessage) => {
      messages.push({ direction, message: JSON.parse(rawMessage) as JsonRpcMessage });
    });

    const connection = new JsonRpcKlighdConnection(transport);

    try {
      await runKlighdSession(connection, source, sandbox, synthesisOptions);
      return createKlighdReplay(source.sourceUri, messages);
    } finally {
      connection.close();
    }
  });
}

/** Returns the synthesis option definitions reported by the language server. */
export function getSynthesisOptions(replay: KlighdReplay): JsonObject[] {
  const updates = replay.actions.filter(({ action }) =>
    isJsonObject(action) && action.kind === "updateOptions",
  );
  const update = updates[updates.length - 1];
  if (!update || !isJsonObject(update.action) || !Array.isArray(update.action.valuedSynthesisOptions)) return [];

  return update.action.valuedSynthesisOptions.flatMap((valuedOption) => {
    if (!isJsonObject(valuedOption) || !isJsonObject(valuedOption.synthesisOption)) return [];
    return [{
      ...valuedOption.synthesisOption,
      currentValue: valuedOption.currentValue ?? valuedOption.synthesisOption.initialValue ?? null,
    }];
  });
}

/**
 * Keeps only the server actions a fresh KLighD container needs to render a snapshot.
 */
export function createKlighdReplay(
  sourceUri: string,
  messages: readonly CapturedKlighdMessage[],
): KlighdReplay {
  const actions = messages.flatMap(({ direction, message }) => {
    if (direction !== "received" || message.method !== "diagram/accept" || !isActionMessage(message.params)) {
      return [];
    }

    return [message.params];
  });

  if (!actions.some((message) => isJsonObject(message.action) && message.action.kind === "setModel")) {
    throw new Error("KLighD did not return a diagram model.");
  }

  return { formatVersion: 1, sourceUri, actions };
}

function isActionMessage(value: unknown): value is JsonObject {
  return isJsonObject(value)
    && typeof value.clientId === "string"
    && isJsonObject(value.action)
    && typeof value.action.kind === "string";
}
