import dts from "vite-plugin-dts";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    copyPublicDir: false,
    lib: {
      name: "JSONRPCClient",
      entry: "./lib/index.ts",
      formats: ["es", "umd"],
      fileName: "index",
    },
  },
  plugins: [
    dts({
      include: ["./lib/"],
    }),
  ],
});
