// SPDX-License-Identifier: MIT

export {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  apiPath,
  isLocalUrl,
  resolveApiKey,
  resolveBaseUrl,
} from "./config.js";

export {
  oligoInputRowSchema,
  oligoQcInstantInputSchema,
  parseRunInput,
  polymeraseIdSchema,
  qcModeSchema,
  severitySchema,
  type OligoInputRow,
  type OligoQcInstantInput,
  type PolymeraseId,
  type QcMode,
  type Severity,
} from "./schemas.js";

export {
  PepkioAPIError,
  type ExampleMeta,
  type ManifestExample,
  type MetricResult,
  type OligoQcMetadata,
  type OligoQcResult,
  type OligoQcRow,
  type OligoQcWarning,
  type PairQcResult,
  type RunOptions,
  type RunResult,
  type RunStatus,
  type ToolManifest,
} from "./types.js";

export {
  PepkioClient,
  type PepkioClientOptions,
  type QcBatchParams,
  type QcPairParams,
} from "./client.js";

import { PepkioClient } from "./client.js";
export default PepkioClient;
