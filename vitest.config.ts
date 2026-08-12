import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirrors the `@/*` path mapping in tsconfig.json so route handlers, which
    // import through the alias, can be tested directly.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // `.worktrees` holds nested checkouts of this repo. Without this exclude the
    // suite collects their stale copies and reports them alongside the real ones.
    exclude: ["**/node_modules/**", "**/.next/**", ".worktrees/**"],
  },
});
