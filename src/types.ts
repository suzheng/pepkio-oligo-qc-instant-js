// SPDX-License-Identifier: MIT
import type {
  OligoInputRow,
  OligoQcInstantInput,
  PolymeraseId,
  QcMode,
  Severity,
} from "./schemas.js";

export type {
  OligoInputRow,
  OligoQcInstantInput,
  PolymeraseId,
  QcMode,
  Severity,
};

export type RunStatus = "queued" | "running" | "completed" | "failed" | (string & {});

export interface RunOptions {
  idempotency_key?: string;
  label?: string;
  [key: string]: unknown;
}

export interface ManifestExample {
  name: string;
  description?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface ToolManifest {
  schema_version: string;
  tool_id: string;
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  execution_mode?: string;
  estimated_runtime_sec?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  agent_notes?: string;
  example_prompts?: string[];
  examples?: ManifestExample[];
  limits?: Record<string, unknown>;
  input_schema?: Record<string, unknown>;
}

export interface ExampleMeta {
  name: string;
  description?: string;
}

export interface MetricResult {
  severity: Severity;
  message: string;
  suggestion?: string;
}

export interface OligoQcRow {
  name: string;
  sequence: string;
  length: number;
  gc_percent: number | null;
  tm_wallace_c: number | null;
  tm_nn_c: number | null;
  tm_salt_corrected_c: number | null;
  hairpin_dg: number | null;
  self_dimer_dg: number | null;
  metrics: {
    gc: MetricResult;
    length: MetricResult;
    hairpin: MetricResult;
    self_dimer: MetricResult;
    overall: MetricResult;
  };
  overall_status: Severity;
  warnings: string[];
  error?: string;
  [key: string]: unknown;
}

export interface PairQcResult {
  name: string;
  forward: OligoQcRow;
  reverse: OligoQcRow;
  delta_tm_c: number | null;
  hetero_dimer_dg: number | null;
  three_prime_overlap_bp: number;
  recommended_ta_c: number | null;
  pair_metrics: {
    delta_tm: MetricResult;
    hetero_dimer: MetricResult;
    three_prime: MetricResult;
    overall: MetricResult;
  };
  overall_status: Severity;
  warnings: string[];
  error?: string;
  [key: string]: unknown;
}

export interface OligoQcWarning {
  level: "error" | "warn" | "info";
  message: string;
  field?: string;
}

export interface OligoQcMetadata {
  na_mM: number;
  mg_mM: number;
  dntp_mM: number;
  oligo_concentration_nM: number;
  batch_truncated?: boolean;
  batch_total_parsed?: number;
  [key: string]: unknown;
}

export interface OligoQcResult {
  mode: QcMode;
  polymerase_id: PolymeraseId;
  warnings: OligoQcWarning[];
  metadata: OligoQcMetadata;
  batch?: OligoQcRow[];
  pair?: PairQcResult;
  all_failed?: boolean;
  error?: string;
  [key: string]: unknown;
}

export interface RunResult<T = OligoQcResult> {
  run_id: string;
  status: RunStatus;
  result?: T;
  error?: string | { message?: string; code?: string; details?: unknown } | null;
  result_url?: string;
  permalink?: string;
  duration_ms?: number;
}

export class PepkioAPIError extends Error {
  readonly status?: number;
  readonly body?: unknown;
  readonly code?: string;
  readonly runId?: string;

  constructor(
    message: string,
    options: {
      status?: number;
      body?: unknown;
      code?: string;
      runId?: string;
    } = {},
  ) {
    super(message);
    this.name = "PepkioAPIError";
    this.status = options.status;
    this.body = options.body;
    this.code = options.code;
    this.runId = options.runId;
  }
}
