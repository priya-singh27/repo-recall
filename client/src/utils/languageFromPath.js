const EXTENSIONS = {
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  py: "python",
  rb: "ruby",
  php: "php",
  java: "java",
  kt: "kotlin",
  go: "go",
  rs: "rust",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  hpp: "cpp",
  cs: "csharp",
  swift: "swift",
  css: "css",
  scss: "scss",
  html: "markup",
  htm: "markup",
  xml: "xml",
  json: "json",
  md: "markdown",
  yml: "yaml",
  yaml: "yaml",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  sql: "sql",
  dockerfile: "docker",
};

export default function languageFromPath(path) {
  const base = String(path).split("/").pop() || "";
  if (base.toLowerCase() === "dockerfile") return "docker";
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "text";
  return EXTENSIONS[base.slice(dot + 1).toLowerCase()] || "text";
}
