// Single entrypoint. Picks Mock vs Real based on env vars at module load.
// All callers import { yalidine } from "@/services/yalidine".

import "server-only";

import { MockYalidineService } from "./mock";
// RealYalidineService is loaded lazily (Phase 5) so its dependency
// (`yalidine` npm package) is only required when credentials are present.
import { yalidineConfigured } from "@/lib/env";
import type { YalidineService } from "./types";

let cached: YalidineService | null = null;

function pick(): YalidineService {
  if (cached) return cached;
  if (yalidineConfigured()) {
    // Phase 5 wires this. We avoid a top-level import so the mock build doesn't
    // require the npm package to be installed.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod: { RealYalidineService: new () => YalidineService } = require("./real");
    cached = new mod.RealYalidineService();
  } else {
    cached = new MockYalidineService();
  }
  return cached;
}

export const yalidine: YalidineService = new Proxy({} as YalidineService, {
  get(_target, prop: keyof YalidineService) {
    const impl = pick();
    const v = impl[prop];
    return typeof v === "function" ? v.bind(impl) : v;
  },
});

export type { YalidineService } from "./types";
export type {
  Wilaya,
  Commune,
  Stopdesk,
  FeeQuote,
  CreateParcelInput,
  ParcelStatus,
} from "./types";
