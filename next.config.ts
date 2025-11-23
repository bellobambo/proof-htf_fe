// next.config.mjs
import type { NextConfig } from "next";
import lingoCompiler from "lingo.dev/compiler";

const nextConfig: NextConfig = {
  turbopack: {},
};

export default lingoCompiler.next({
  sourceLocale: "fr",
  targetLocales: ["es", "ja", "fr", "ru", "de", "zh", "ar", "ko"],
  models: "lingo.dev",
  useDirective: true,
  rsc: true,
  debug: true,
})(nextConfig);
