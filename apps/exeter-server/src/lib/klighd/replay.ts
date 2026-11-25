import type { ActionMessage } from "@kieler/klighd-core";

/** A value that can be stored in JSON and JSONB without conversion. */
export type JsonValue = null | boolean | number | string | JsonValue[] | JsonObject;

/** A string-keyed JSON object. */
export interface JsonObject {
  [key: string]: JsonValue;
}

/**
 * Server actions required to render one previously generated KLighD diagram.
 */
export interface KlighdReplay {
  formatVersion: 1;
  sourceUri: string;
  actions: JsonObject[];
}

/**
 * Returns whether a value is a JSON object.
 */
export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Returns whether a database value has Exeter's supported replay format.
 */
export function isKlighdReplay(value: unknown): value is KlighdReplay {
  return isJsonObject(value)
    && value.formatVersion === 1
    && typeof value.sourceUri === "string"
    && Array.isArray(value.actions)
    && value.actions.every(isJsonObject);
}

/**
 * Converts a stored JSON object into the action shape expected by KLighD core.
 */
export function asActionMessage(value: JsonObject): ActionMessage | undefined {
  if (!isJsonObject(value.action) || typeof value.clientId !== "string" || typeof value.action.kind !== "string") {
    return undefined;
  }

  return value as unknown as ActionMessage;
}
