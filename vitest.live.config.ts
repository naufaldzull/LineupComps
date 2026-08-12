import { loadEnv, mergeConfig } from "vite";
import { defineConfig } from "vitest/config";

import baseConfig from "./vitest.config";

/**
 * Config for the opt-in checks that talk to the real provider. Kept out of the
 * default suite so `npm test` stays offline and spends no API quota: the file it
 * targets is deliberately not named `*.test.ts`, so nothing else collects it.
 *
 * Run with `npm run verify:leagues`.
 */
const localEnv = loadEnv("test", process.cwd(), "");

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ["src/lib/__tests__/*.live.ts"],
      env: localEnv.APISPORTS_KEY
        ? { APISPORTS_KEY: localEnv.APISPORTS_KEY }
        : {},
    },
  }),
);
