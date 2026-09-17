import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    alias: {
      "server-only": resolve(
        process.cwd(),
        "src/infrastructure/server-only.stub.ts",
      ),
    },
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
