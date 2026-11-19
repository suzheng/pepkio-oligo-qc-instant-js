// SPDX-License-Identifier: MIT
import { describe, expect, it } from "vitest";
import { PepkioClient } from "../src/client.js";
import { TOOL_ID } from "../src/config.js";

const LOCAL_BASE_URL = "https://tools.localtest.me";
const PRODUCTION_BASE_URL = "https://tools.pepkio.com";

function envConfig(env: "local" | "production") {
  const baseUrl = process.env.PEPKIO_API_BASE_URL
    ? process.env.PEPKIO_API_BASE_URL.replace(/\/$/, "")
    : env === "local"
      ? LOCAL_BASE_URL
      : PRODUCTION_BASE_URL;

  const isLocal = baseUrl.includes("localtest.me") || baseUrl.includes("localhost");
  const apiKey = isLocal
    ? process.env.LOCAL_PEPKIO_API_KEY ?? process.env.PEPKIO_API_KEY
    : process.env.PEPKIO_API_KEY;

  return { baseUrl, apiKey, isLocal };
}

describe("integration: local", () => {
  const { baseUrl, apiKey } = envConfig("local");

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("Oligo QC Instant");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("batch_two_primers");
      expect(names).toContain("pair_q5");
    },
    30_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs batch_two_primers",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("batch_two_primers");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.mode).toBe("batch");
      expect(result.result?.batch?.length).toBe(2);
      expect(result.result?.batch?.[0].name).toBe("primer_1");
      expect(result.result?.batch?.[0].length).toBe(21);
      expect(result.result?.batch?.[1].name).toBe("primer_2");
      expect(result.result?.batch?.[1].overall_status).toBe("pass");
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs pair_q5",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("pair_q5");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.mode).toBe("pair");
      expect(result.result?.pair?.forward).toBeDefined();
      expect(result.result?.pair?.reverse).toBeDefined();
      expect(result.result?.pair?.overall_status).toBe("pass");
    },
    60_000,
  );
});

describe("integration: production", () => {
  const { baseUrl, apiKey } = envConfig("production");

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("Oligo QC Instant");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("batch_two_primers");
      expect(names).toContain("pair_q5");
    },
    30_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs batch_two_primers",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("batch_two_primers");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.mode).toBe("batch");
      expect(result.result?.batch?.length).toBe(2);
      expect(result.result?.batch?.[0].name).toBe("primer_1");
      expect(result.result?.batch?.[0].length).toBe(21);
      expect(result.result?.batch?.[1].name).toBe("primer_2");
      expect(result.result?.batch?.[1].overall_status).toBe("pass");
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs pair_q5",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("pair_q5");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.run_id).toBeTruthy();
      expect(result.result).toBeDefined();
      expect(result.result?.mode).toBe("pair");
      expect(result.result?.pair?.forward).toBeDefined();
      expect(result.result?.pair?.reverse).toBeDefined();
      expect(result.result?.pair?.overall_status).toBe("pass");
    },
    60_000,
  );
});
