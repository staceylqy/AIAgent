import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { sharePlugin } from "./server/share";

export default defineConfig({
  plugins: [react(), sharePlugin()],
  // QRコードをスマホで読み取れるよう、LAN公開 (host) で起動する
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 4173,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "server/**/*.test.ts"],
  },
});
