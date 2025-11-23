import lingoCompiler from "lingo.dev/compiler";

const nextConfig = {
  turbopack: {},
};

export default lingoCompiler.next({
  sourceLocale: "en",
  targetLocales: ["en", "es", "fr", "de"], 
  sourceRoot: "app", 
  lingoDir: "lingo", 
  rsc: true,
  useDirective: false,

  models: "lingo.dev",
})(nextConfig);
