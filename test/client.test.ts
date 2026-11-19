// SPDX-License-Identifier: MIT
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PepkioClient } from "../src/client.js";
import {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  isLocalUrl,
  resolveApiKey,
  resolveBaseUrl,
} from "../src/config.js";
import { parseRunInput } from "../src/schemas.js";
import { PepkioAPIError } from "../src/types.js";

const mockManifest = {
  schema_version: "1.0",
  tool_id: TOOL_ID,
  title: "Oligo QC Instant",
  description: "Batch primer quality checker with GC%, multi-method Tm, hairpin and dimer flags",
  examples: [
    {
      name: "batch_two_primers",
      input: {
        mode: "batch",
        polymerase_id: "q5",
        batch_text: "ATGCGTACGTACGTACGTACG\nGAAGGTGAAGGTCGGAGTCAAC\n",
      },
      output: {
        batch: [{ overall_status: "pass" }],
      },
    },
    {
      name: "pair_q5",
      input: {
        mode: "pair",
        name: "GAPDH",
        fwd_seq: "GAAGGTGAAGGTCGGAGTC",
        rev_seq: "GAAGATGGTGATGGGATTTC",
        polymerase_id: "q5",
      },
      output: {
        pair: { overall_status: "pass" },
      },
    },
    {
      name: "invalid_sequence",
      input: {
        mode: "batch",
        polymerase_id: "taq",
        batch_text: "ATGCX",
      },
      output: {
        batch: [{ overall_status: "fail" }],
      },
    },
  ],
};

const mockRunResponse = {
  run_id: "test-run-oligo-qc-123",
  status: "completed",
  result: {
    mode: "pair",
    polymerase_id: "q5",
    warnings: [],
    metadata: {
      na_mM: 0,
      mg_mM: 2,
      dntp_mM: 0.8,
      oligo_concentration_nM: 250,
    },
    pair: {
      name: "GAPDH",
      forward: {
        name: "GAPDH_F",
        sequence: "GAAGGTGAAGGTCGGAGTC",
        length: 19,
        gc_percent: 57.9,
        tm_wallace_c: 60,
        tm_nn_c: 61.2,
        tm_salt_corrected_c: 63.5,
        hairpin_dg: 0,
        self_dimer_dg: 0,
        metrics: {
          gc: { severity: "pass", message: "GC 58%" },
          length: { severity: "pass", message: "Length 19" },
          hairpin: { severity: "pass", message: "No strong hairpin" },
          self_dimer: { severity: "pass", message: "No dimer" },
          overall: { severity: "pass", message: "Pass" },
        },
        overall_status: "pass",
        warnings: [],
      },
      reverse: {
        name: "GAPDH_R",
        sequence: "GAAGATGGTGATGGGATTTC",
        length: 20,
        gc_percent: 45,
        tm_wallace_c: 58,
        tm_nn_c: 59.8,
        tm_salt_corrected_c: 62.1,
        hairpin_dg: 0,
        self_dimer_dg: 0,
        metrics: {
          gc: { severity: "pass", message: "GC 45%" },
          length: { severity: "pass", message: "Length 20" },
          hairpin: { severity: "pass", message: "No strong hairpin" },
          self_dimer: { severity: "pass", message: "No dimer" },
          overall: { severity: "pass", message: "Pass" },
        },
        overall_status: "pass",
        warnings: [],
      },
      delta_tm_c: 1.4,
      hetero_dimer_dg: 0,
      three_prime_overlap_bp: 0,
      recommended_ta_c: 57.1,
      pair_metrics: {
        delta_tm: { severity: "pass", message: "Delta Tm 1.4 C" },
        hetero_dimer: { severity: "pass", message: "No heterodimer" },
        three_prime: { severity: "pass", message: "No 3' overlap" },
        overall: { severity: "pass", message: "Pass" },
      },
      overall_status: "pass",
      warnings: [],
    },
    all_failed: false,
  },
  error: null,
  result_url: "https://tools.pepkio.com/api/tools/v1/runs/test-run-oligo-qc-123",
  permalink: "https://tools.pepkio.com/r/test-run-oligo-qc-123",
};

describe("PepkioClient config & resolution", () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...origEnv };
    delete process.env.PEPKIO_API_BASE_URL;
    delete process.env.PEPKIO_API_KEY;
    delete process.env.LOCAL_PEPKIO_API_KEY;
  });

  afterEach(() => {
    process.env = { ...origEnv };
  });

  it("resolves default production base URL", () => {
    expect(resolveBaseUrl()).toBe(DEFAULT_API_BASE_URL);
    expect(resolveBaseUrl(undefined)).toBe("https://tools.pepkio.com");
  });

  it("resolves base URL from env var", () => {
    process.env.PEPKIO_API_BASE_URL = "https://staging.pepkio.com/";
    expect(resolveBaseUrl()).toBe("https://staging.pepkio.com");
  });

  it("prioritizes constructor override over env var", () => {
    process.env.PEPKIO_API_BASE_URL = "https://staging.pepkio.com";
    expect(resolveBaseUrl("https://tools.localtest.me/")).toBe(
      "https://tools.localtest.me",
    );
  });

  it("identifies local vs remote URLs correctly", () => {
    expect(isLocalUrl("https://tools.localtest.me")).toBe(true);
    expect(isLocalUrl("http://localhost:3004")).toBe(true);
    expect(isLocalUrl("http://127.0.0.1:3004")).toBe(true);
    expect(isLocalUrl("https://tools.pepkio.com")).toBe(false);
  });

  it("resolves production API key from env", () => {
    process.env.PEPKIO_API_KEY = "pk_prod_123";
    expect(resolveApiKey("https://tools.pepkio.com")).toBe("pk_prod_123");
  });

  it("resolves local API key preferring LOCAL_PEPKIO_API_KEY", () => {
    process.env.LOCAL_PEPKIO_API_KEY = "pk_local_123";
    process.env.PEPKIO_API_KEY = "pk_prod_123";
    expect(resolveApiKey("https://tools.localtest.me")).toBe("pk_local_123");
  });

  it("falls back to PEPKIO_API_KEY for local if LOCAL_PEPKIO_API_KEY unset", () => {
    process.env.PEPKIO_API_KEY = "pk_prod_123";
    expect(resolveApiKey("https://tools.localtest.me")).toBe("pk_prod_123");
  });

  it("honors explicit API key override", () => {
    process.env.PEPKIO_API_KEY = "pk_prod_123";
    expect(resolveApiKey("https://tools.pepkio.com", "pk_custom")).toBe("pk_custom");
  });
});

describe("PepkioClient schema validation", () => {
  it("validates a minimal pair input", () => {
    const parsed = parseRunInput({
      mode: "pair",
      fwd_seq: "ATGCATGC",
      rev_seq: "CGTACGTA",
      polymerase_id: "q5",
    });
    expect(parsed.mode).toBe("pair");
    expect(parsed.fwd_seq).toBe("ATGCATGC");
    expect(parsed.polymerase_id).toBe("q5");
  });

  it("validates a minimal batch input", () => {
    const parsed = parseRunInput({
      mode: "batch",
      polymerase_id: "taq",
      batch_text: "ATGCATGC\nCGTACGTA",
    });
    expect(parsed.mode).toBe("batch");
    expect(parsed.polymerase_id).toBe("taq");
  });

  it("rejects invalid mode or missing required fields", () => {
    expect(() => parseRunInput({ mode: "unknown", polymerase_id: "q5" })).toThrow();
    expect(() => parseRunInput({ mode: "pair" })).toThrow();
  });
});

describe("PepkioClient API interactions (mocked fetch)", () => {
  const origFetch = global.fetch;

  afterEach(() => {
    global.fetch = origFetch;
    vi.restoreAllMocks();
  });

  it("fetches and caches manifest", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    });
    global.fetch = fetchMock;

    const client = new PepkioClient();
    const manifest1 = await client.getManifest();
    expect(manifest1.tool_id).toBe(TOOL_ID);
    expect(manifest1.title).toBe("Oligo QC Instant");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://tools.pepkio.com/api/tools/v1/tools/oligo-qc-instant/manifest",
      expect.objectContaining({ method: "GET" }),
    );

    // Cached call should not trigger another fetch
    const manifest2 = await client.getManifest();
    expect(manifest2).toEqual(manifest1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Refresh option should trigger fetch
    await client.getManifest({ refresh: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("lists examples and retrieves example input", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    });
    global.fetch = fetchMock;

    const client = new PepkioClient();
    const examples = await client.getExamples();
    expect(examples.map((e) => e.name)).toEqual([
      "batch_two_primers",
      "pair_q5",
      "invalid_sequence",
    ]);

    const input = await client.getExampleInput("pair_q5");
    expect(input.mode).toBe("pair");
    expect(input.fwd_seq).toBe("GAAGGTGAAGGTCGGAGTC");

    await expect(client.getExampleInput("non_existent")).rejects.toThrow(
      /Example "non_existent" not found/,
    );
  });

  it("runs tool with auth header and options", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockRunResponse),
    });
    global.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test_key" });
    const result = await client.run(
      {
        mode: "pair",
        name: "GAPDH",
        fwd_seq: "GAAGGTGAAGGTCGGAGTC",
        rev_seq: "GAAGATGGTGATGGGATTTC",
        polymerase_id: "q5",
      },
      { label: "test-run", idempotency_key: "idemp-1" },
    );

    expect(result.status).toBe("completed");
    expect(result.run_id).toBe("test-run-oligo-qc-123");
    expect(result.result?.pair?.overall_status).toBe("pass");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://tools.pepkio.com/api/tools/v1/tools/oligo-qc-instant/run",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test_key",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("throws when running without API key", async () => {
    const origKey = process.env.PEPKIO_API_KEY;
    delete process.env.PEPKIO_API_KEY;
    delete process.env.LOCAL_PEPKIO_API_KEY;
    try {
      const client = new PepkioClient({ apiKey: "" });
      await expect(
        client.run({
          mode: "pair",
          fwd_seq: "ATGC",
          rev_seq: "CGTA",
          polymerase_id: "q5",
        }),
      ).rejects.toThrow(PepkioAPIError);
    } finally {
      if (origKey) process.env.PEPKIO_API_KEY = origKey;
    }
  });

  it("supports qcPair convenience method", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockRunResponse),
    });
    global.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test_key" });
    const result = await client.qcPair({
      name: "GAPDH",
      fwdSeq: "GAAGGTGAAGGTCGGAGTC",
      revSeq: "GAAGATGGTGATGGGATTTC",
      polymeraseId: "q5",
    });

    expect(result.status).toBe("completed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [callUrl, callInit] = fetchMock.mock.calls[0];
    expect(callUrl).toContain("/api/tools/v1/tools/oligo-qc-instant/run");
    const sent = JSON.parse(callInit.body as string);
    expect(sent.input).toEqual({
      mode: "pair",
      name: "GAPDH",
      fwd_seq: "GAAGGTGAAGGTCGGAGTC",
      rev_seq: "GAAGATGGTGATGGGATTTC",
      polymerase_id: "q5",
    });
  });

  it("supports qcBatch convenience method", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockRunResponse),
    });
    global.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test_key" });
    const result = await client.qcBatch({
      text: "ATGCGTACGTACGTACGTACG\nGAAGGTGAAGGTCGGAGTCAAC\n",
      polymeraseId: "q5",
    });

    expect(result.status).toBe("completed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [callUrl, callInit] = fetchMock.mock.calls[0];
    expect(callUrl).toContain("/api/tools/v1/tools/oligo-qc-instant/run");
    const sent = JSON.parse(callInit.body as string);
    expect(sent.input).toEqual({
      mode: "batch",
      polymerase_id: "q5",
      batch_text: "ATGCGTACGTACGTACGTACG\nGAAGGTGAAGGTCGGAGTCAAC\n",
    });
  });

  it("gets run status and waits for run completion", async () => {
    let callCount = 0;
    const fetchMock = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              run_id: "run-async-1",
              status: "running",
            }),
        };
      }
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            run_id: "run-async-1",
            status: "completed",
            result: mockRunResponse.result,
          }),
      };
    });
    global.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test_key" });
    const singleGet = await client.getRun("run-async-1");
    expect(singleGet.status).toBe("running");

    const polled = await client.waitForRun("run-async-1", {
      intervalMs: 10,
      timeoutMs: 500,
    });
    expect(polled.status).toBe("completed");
  });

  it("handles HTTP error response and extracts message", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () =>
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid primer sequence",
          },
        }),
    });
    global.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test_key" });
    await expect(
      client.run({
        mode: "pair",
        fwd_seq: "INVALID",
        rev_seq: "INVALID",
        polymerase_id: "q5",
      }),
    ).rejects.toMatchObject({
      name: "PepkioAPIError",
      message: "Invalid primer sequence",
      status: 400,
      code: "VALIDATION_ERROR",
    });
  });

  it("handles error field in completed response body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          run_id: "run-err-1",
          status: "failed",
          error: "Calculation exceeded resource limits",
        }),
    });
    global.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test_key" });
    await expect(
      client.run({
        mode: "pair",
        fwd_seq: "ATGC",
        rev_seq: "CGTA",
        polymerase_id: "q5",
      }),
    ).rejects.toMatchObject({
      name: "PepkioAPIError",
      message: "Calculation exceeded resource limits",
      runId: "run-err-1",
    });
  });
});
