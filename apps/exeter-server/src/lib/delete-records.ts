import { z } from "zod";

const IdSchema = z.uuid();

/** Reads a non-empty, de-duplicated set of UUID form values named `ids`. */
export function readRecordIds(formData: FormData): string[] | null {
  const ids = [...new Set(formData.getAll("ids").filter((value): value is string => typeof value === "string"))];
  return ids.length > 0 && ids.every((id) => IdSchema.safeParse(id).success) ? ids : null;
}
