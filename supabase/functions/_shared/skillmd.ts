import { parse as parseYaml } from "npm:yaml@2";

export const IGNORED = /(^|\/)(node_modules|\.git|\.github|template|templates|test|tests|fixtures|examples?|__tests__|vendor|dist|build)\//i;
export const SCRIPT_EXT = /\.(py|sh|bash|js|mjs|cjs|ts|rb|ps1|go)$/i;

export function encodePath(p: string) {
  return p.split("/").map(encodeURIComponent).join("/");
}

/** Extrae nombre, descripción y licencia del frontmatter de un SKILL.md. */
export function parseSkillMd(md: string) {
  const m = md.match(/^﻿?\s*---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  if (!m) return null;
  let meta: Record<string, unknown> = {};
  try {
    const parsed = parseYaml(m[1]);
    if (parsed && typeof parsed === "object") meta = parsed as Record<string, unknown>;
  } catch {
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
      if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
    }
  }
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : undefined);
  const name = str(meta.name);
  const description = (str(meta.description) ?? "").replace(/\s+/g, " ").slice(0, 700);
  if (!name && !description) return null;
  return { name, description, license: str(meta.license)?.slice(0, 120) };
}
