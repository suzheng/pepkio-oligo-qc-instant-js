// SPDX-License-Identifier: MIT
import { z } from "zod";

export const qcModeSchema = z.enum(["batch", "pair"]);
export type QcMode = z.infer<typeof qcModeSchema>;

export const polymeraseIdSchema = z.enum([
  "q5",
  "phusion",
  "taq",
  "kapa_hifi",
  "custom",
]);
export type PolymeraseId = z.infer<typeof polymeraseIdSchema>;

export const severitySchema = z.enum(["pass", "caution", "fail"]);
export type Severity = z.infer<typeof severitySchema>;

export const oligoInputRowSchema = z
  .object({
    name: z.string().optional(),
    sequence: z.string().min(1, "Sequence must not be empty"),
  })
  .passthrough();
export type OligoInputRow = z.infer<typeof oligoInputRowSchema>;

export const oligoQcInstantInputSchema = z
  .object({
    mode: qcModeSchema,
    name: z.string().optional(),
    fwd_seq: z.string().optional(),
    rev_seq: z.string().optional(),
    batch_rows: z.array(oligoInputRowSchema).optional(),
    batch_text: z.string().optional(),
    batch_csv: z.string().optional(),
    polymerase_id: polymeraseIdSchema,
    custom_na_mM: z.number().positive().optional(),
    custom_mg_mM: z.number().min(0).optional(),
    custom_dntp_mM: z.number().min(0).optional(),
    oligo_concentration_nM: z.number().positive().optional(),
  })
  .passthrough();
export type OligoQcInstantInput = z.infer<typeof oligoQcInstantInputSchema>;

export function parseRunInput(input: unknown): OligoQcInstantInput {
  return oligoQcInstantInputSchema.parse(input);
}
