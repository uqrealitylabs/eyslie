import { defineConfig } from "vite";

const rawBase = process.env.DEMO_BASE_PATH ?? "/";
const base = rawBase === "/" ? "/" : `/${rawBase.replace(/^\/+|\/+$/g, "")}/`;

export default defineConfig({
  root: "examples/demo",
  base,
  build: {
    outDir: "../../demo-dist",
    emptyOutDir: true,
  },
  server: {
    host: "127.0.0.1",
    port: Number(process.env.PORT ?? 4173),
  },
});
