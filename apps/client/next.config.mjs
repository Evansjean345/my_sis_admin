import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Monorepo : le code partagé (`packages/shared`, alias `@shared/*`) est hors de l'application.
  turbopack: { root },
  outputFileTracingRoot: root,
};

export default nextConfig;
