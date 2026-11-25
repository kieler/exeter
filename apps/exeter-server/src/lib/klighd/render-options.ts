import "reflect-metadata";
import { RenderOptionsRegistry } from "@kieler/klighd-core/lib/options/render-options-registry";
import {
  TransformationOptionType,
  type RenderOption,
} from "@kieler/klighd-core/lib/options/option-models";

export type DiagramOptionValue = boolean | number | string;

export type DiagramRenderOptions = Record<string, DiagramOptionValue>;

export type DiagramOptionKind = "check" | "choice" | "range" | "text" | "separator" | "category";

/**
 * Serializable description of one render option defined by KLighD core.
 */
export interface DiagramOption {
  id: string;
  name: string;
  description?: string;
  kind: DiagramOptionKind;
  initialValue: DiagramOptionValue;
  currentValue: DiagramOptionValue;
  categoryId?: string;
  values?: DiagramOptionValue[];
  range?: { min: number; max: number; step: number };
}

/**
 * Lists every render option currently registered by the local KLighD client.
 */
export function listDiagramOptions(): DiagramOption[] {
  const registry = new RenderOptionsRegistry();
  return registry.allRenderOptions.map(toDiagramOption);
}

/**
 * Returns the default values of every render option registered by the local KLighD client.
 */
export function defaultDiagramRenderOptions(): DiagramRenderOptions {
  return Object.fromEntries(
    listDiagramOptions().map((option) => [option.id, option.currentValue]),
  );
}

/**
 * Returns whether a value can be persisted as KLighD render-option values.
 */
export function isDiagramRenderOptions(value: unknown): value is DiagramRenderOptions {
  return typeof value === "object"
    && value !== null
    && !Array.isArray(value)
    && Object.values(value).every((optionValue) =>
      typeof optionValue === "boolean"
      || typeof optionValue === "number"
      || typeof optionValue === "string",
    );
}

function toDiagramOption(option: RenderOption): DiagramOption {
  const diagramOption: DiagramOption = {
    id: option.id,
    name: option.name,
    description: option.description,
    kind: toDiagramOptionKind(option.type),
    initialValue: toDiagramOptionValue(option.initialValue),
    currentValue: toDiagramOptionValue(option.currentValue),
    categoryId: option.renderCategory,
  };

  if (option.values) {
    diagramOption.values = option.values.map(toDiagramOptionValue);
  }

  if (option.type === TransformationOptionType.RANGE) {
    const rangeOption = option as RenderOption & {
      range: { first: number; second: number };
      stepSize: number;
    };
    diagramOption.range = {
      min: rangeOption.range.first,
      max: rangeOption.range.second,
      step: rangeOption.stepSize,
    };
  }

  return diagramOption;
}

function toDiagramOptionKind(type: TransformationOptionType): DiagramOptionKind {
  switch (type) {
    case TransformationOptionType.CHECK:
      return "check";
    case TransformationOptionType.CHOICE:
      return "choice";
    case TransformationOptionType.RANGE:
      return "range";
    case TransformationOptionType.TEXT:
      return "text";
    case TransformationOptionType.SEPARATOR:
      return "separator";
    case TransformationOptionType.CATEGORY:
      return "category";
    default:
      throw new Error(`Unsupported KLighD render option type: ${type}`);
  }
}

function toDiagramOptionValue(value: unknown): DiagramOptionValue {
  if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }
  throw new Error("KLighD render options must have primitive values.");
}
