import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const standaloneOutput = process.env.QSB_ASK_STANDALONE_OUTPUT === "1";

const nextConfig: NextConfig = {
  ...(standaloneOutput ? { output: "standalone" } : {}),
  turbopack: {
    root: projectRoot,
  },
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: "tsconfig.json",
  },
};

export default nextConfig;
