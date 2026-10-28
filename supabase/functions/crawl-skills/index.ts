// SkillVerse — rastreador v2
// phase "discover": busca repos en GitHub por temas y rangos de estrellas y los encola.
// phase "crawl": lista los archivos de cada repo (jsDelivr, con GitHub como respaldo),
// lee cada SKILL.md y guarda las skills. La clasificación la hace classify-skills.
import { createClient } from "npm:@supabase/supabase-js@2";
import { encodePath, IGNORED, parseSkillMd, SCRIPT_EXT } from "../_shared/skillmd.ts";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
const TIME_BUDGET_MS = 40_000;
// Supabase limita ~2 s de CPU por ejecución: lotes chicos y tope de archivos procesados
const MAX_SKILLS_PER_REPO = 150;
const MAX_FILES_PER_REPO = 25_000;
const MAX_FILES_PER_RUN = 40_000;
const NEW_SKILLS_PER_REPO_RUN = 40; // lo que falte se completa en la siguiente pasada

type Source = { id: number; full_name: string; repo_id: number; default_branch: string; trust: string };
type FileEntry = { path: string; hash: string };

const rate = { core: Infinity, search: Infinity };

async function gh(path: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "skillverse-crawler",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  const remaining = Number(res.headers.get("x-ratelimit-remaining"));
  const resource = res.headers.get("x-ratelimit-resource");
  if (!Number.isNaN(remaining) && (resource === "core" || resource === "search")) rate[resource] = remaining;
  return res;
}

async function pool<T>(items: T[], size: number, fn: (t: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

// ---------------- Descubrimiento ----------------
async function discover(started: number) {
  const maxCalls = GITHUB_TOKEN ? 25 : 8;
  const { data: queries, error } = await supabase
    .from("discovery_queries")
    .select("id, query, next_page")
    .eq("enabled", true)
    .lte("next_run_at", new Date().toISOString())
    .order("priority")
    .order("next_run_at")
    .limit(maxCalls);
  if (error) throw error;

  let calls = 0, repos = 0;
  for (const q of queries ?? []) {
    if (Date.now() - started > TIME_BUDGET_MS || rate.search <= 1) break;
    const res = await gh(`/search/repositories?q=${encodeURIComponent(q.query)}&sort=stars&order=desc&per_page=100&page=${q.next_page}`);
    calls++;
    if (res.status === 403 || res.status === 429) { rate.search = 0; break; }
    if (!res.ok) {
      await supabase.from("discovery_queries").update({ last_run_at: new Date().toISOString(), next_run_at: new Date(Date.now() + 3600_000).toISOString() }).eq("id", q.id);
      continue;
    }
    const body = await res.json();
    const items = (body.items ?? []).map((r: any) => ({
      repo_id: r.id, full_name: r.full_name, stars: r.stargazers_count, forks: r.forks_count,
      description: r.description?.slice(0, 500) ?? null, default_branch: r.default_branch,
      owner_avatar_url: r.owner?.avatar_url, topics: r.topics ?? [], homepage: r.homepage,
      license: r.license?.spdx_id && r.license.spdx_id !== "NOASSERTION" ? r.license.spdx_id : null,
      pushed_at: r.pushed_at, fork: r.fork, archived: r.archived,
    }));
    if (items.length) {
      const { data: n, error: e } = await supabase.rpc("apply_discovery", { p_items: items, p_via: q.query });
      if (e) throw e;
      repos += n ?? 0;
    }
    const total = Math.min(body.total_count ?? 0, 1000);
    const lastPage = Math.max(1, Math.ceil(total / 100));
    const done = q.next_page >= lastPage || items.length < 100;
    await supabase.from("discovery_queries").update({
      total_count: body.total_count ?? null,
      last_run_at: new Date().toISOString(),
      next_page: done ? 1 : q.next_page + 1,
      next_run_at: new Date(Date.now() + (done ? 12 * 3600_000 : 0)).toISOString(),
    }).eq("id", q.id);
  }
  return { search_calls: calls, repos_seen: repos };
}

// ---------------- Rastreo ----------------
async function listFiles(src: Source): Promise<{ files: FileEntry[]; complete: boolean }> {
  const res = await fetch(`https://data.jsdelivr.com/v1/packages/gh/${src.full_name}@${encodeURIComponent(src.default_branch)}?structure=flat`);
  if (res.ok) {
    const body = await res.json();
    return { files: (body.files ?? []).map((f: any) => ({ path: String(f.name).replace(/^\//, ""), hash: f.hash })), complete: true };
  }
  // Respaldo: árbol de Git (consume cupo de la API de GitHub)
  if (rate.core > 5) {
    const t = await gh(`/repos/${src.full_name}/git/trees/${encodeURIComponent(src.default_branch)}?recursive=1`);
    if (t.ok) {
      const tree = await t.json();
      const files = (tree.tree ?? []).filter((x: any) => x.type === "blob").map((x: any) => ({ path: x.path, hash: x.sha }));
      return { files, complete: !tree.truncated };
    }
    throw new Error(`GitHub ${t.status} al listar ${src.full_name}`);
  }
  throw new Error(`jsDelivr ${res.status} y sin cupo en GitHub para ${src.full_name}`);
}

async function fetchText(src: Source, path: string) {
  const urls = [
    `https://cdn.jsdelivr.net/gh/${src.full_name}@${encodeURIComponent(src.default_branch)}/${encodePath(path)}`,
    `https://raw.githubusercontent.com/${src.full_name}/${encodeURIComponent(src.default_branch)}/${encodePath(path)}`,
  ];
  for (const u of urls) {
    const r = await fetch(u);
    if (r.ok) return await r.text();
  }
  return null;
}

/** Cuenta archivos y detecta scripts bajo cada carpeta de skill en una sola pasada. */
function folderStats(files: FileEntry[], dirs: Set<string>) {
  const stats = new Map<string, { count: number; scripts: boolean }>();
  for (const d of dirs) stats.set(d, { count: 0, scripts: false });
  const hasRoot = dirs.has("");
  for (const f of files) {
    const isScript = SCRIPT_EXT.test(f.path);
    if (hasRoot) { const st = stats.get("")!; st.count++; st.scripts ||= isScript; }
    let idx = f.path.lastIndexOf("/");
    while (idx > 0) {
      const st = stats.get(f.path.slice(0, idx));
      if (st) { st.count++; st.scripts ||= isScript; }
      idx = f.path.lastIndexOf("/", idx - 1);
    }
  }
  return stats;
}

async function crawlSource(src: Source, budget: { files: number }) {
  const { files, complete } = await listFiles(src);
  if (files.length > MAX_FILES_PER_REPO) {
    await supabase.rpc("skip_source", { p_source_id: src.id, p_reason: `Repositorio demasiado grande (${files.length} archivos)` });
    return { found: 0, new: 0, changed: 0 };
  }
  budget.files += files.length;

  const skillFiles = files
    .filter((f) => (f.path === "SKILL.md" || f.path.endsWith("/SKILL.md")) && !IGNORED.test(f.path))
    .slice(0, MAX_SKILLS_PER_REPO);
  const dirOf = (p: string) => (p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "");
  const stats = folderStats(files, new Set(skillFiles.map((f) => dirOf(f.path))));

  const { data: existingRows } = await supabase.from("skills").select("path, content_sha").eq("repo_id", src.repo_id);
  const existing = new Map((existingRows ?? []).map((e) => [e.path, e.content_sha]));

  const out: Record<string, unknown>[] = [];
  let fetched = 0;
  let partial = false;
  await pool(skillFiles, 6, async (file) => {
    const dir = dirOf(file.path);
    const st = stats.get(dir)!;
    const base = {
      path: dir,
      content_sha: file.hash,
      has_scripts: st.scripts,
      file_count: st.count,
      html_url: `https://github.com/${src.full_name}/tree/${encodeURIComponent(src.default_branch)}/${encodePath(dir)}`,
      raw_url: `https://raw.githubusercontent.com/${src.full_name}/${encodeURIComponent(src.default_branch)}/${encodePath(file.path)}`,
    };
    const prev = existing.get(dir);
    if (prev === file.hash) { out.push(base); return; }
    if (fetched >= NEW_SKILLS_PER_REPO_RUN) {
      partial = true;
      if (prev !== undefined) out.push({ ...base, content_sha: prev }); // se conserva hasta la próxima pasada
      return;
    }
    fetched++;
    const text = await fetchText(src, file.path);
    if (!text) return;
    const parsed = parseSkillMd(text);
    if (!parsed) return; // sin frontmatter válido: no es una skill real
    const folder = dir.split("/").pop() || src.full_name.split("/")[1];
    const name = (parsed.name || folder).slice(0, 120);
    out.push({
      ...base,
      name,
      description: parsed.description,
      license: parsed.license ?? null,
      install_command: `npx skills add ${src.full_name} --skill ${name}`,
    });
  });

  const { data, error } = await supabase.rpc("upsert_repo_skills", { p_source_id: src.id, p_skills: out, p_complete: complete && !partial });
  if (error) throw error;
  if (partial) {
    // vuelve a la cola para terminar las skills que faltan
    await supabase.from("sources").update({ status: "pending", crawl_claimed_at: null }).eq("id", src.id);
  }
  return { found: out.length, ...(data as { new: number; changed: number }) };
}

async function crawl(started: number) {
  const { data: batch, error } = await supabase.rpc("claim_crawl_batch", { p_limit: 5 });
  if (error) throw error;
  let scanned = 0, found = 0, added = 0, failed = 0;
  const errors: string[] = [];
  const budget = { files: 0 };
  await pool((batch ?? []) as Source[], 2, async (src) => {
    if (Date.now() - started > TIME_BUDGET_MS || budget.files > MAX_FILES_PER_RUN) {
      await supabase.from("sources").update({ crawl_claimed_at: null }).eq("id", src.id);
      return;
    }
    try {
      const r = await crawlSource(src, budget);
      scanned++; found += r.found; added += r.new;
    } catch (e) {
      failed++;
      const msg = (e as { message?: string })?.message ?? String(e);
      if (errors.length < 5) errors.push(`${src.full_name}: ${msg}`);
      await supabase.rpc("mark_source_error", { p_source_id: src.id, p_error: msg });
    }
  });
  if (added > 0) await supabase.rpc("mark_duplicates");
  return { repos_scanned: scanned, skills_found: found, skills_new: added, failed, errors };
}

Deno.serve(async (req) => {
  const { data: ok } = await supabase.rpc("verify_crawl_secret", { p_secret: req.headers.get("x-crawl-secret") ?? "" });
  if (!ok) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const body = await req.json().catch(() => ({}));
  const phase = body.phase ?? "crawl";
  const started = Date.now();
  const { data: run } = await supabase.from("crawl_runs").insert({}).select("id").single();

  try {
    const result = phase === "discover" ? await discover(started) : await crawl(started);
    const r = result as Record<string, number | string[]>;
    await supabase.from("crawl_runs").update({
      finished_at: new Date().toISOString(),
      status: (r.failed as number) > 0 ? "partial" : "success",
      repos_scanned: (r.repos_scanned as number) ?? (r.repos_seen as number) ?? 0,
      skills_found: (r.skills_found as number) ?? 0,
      skills_new: (r.skills_new as number) ?? 0,
      error: Array.isArray(r.errors) && r.errors.length ? `${phase}: ${r.errors.join("\n")}`.slice(0, 2000) : null,
    }).eq("id", run?.id);
    return Response.json({ phase, ...result, rate, ms: Date.now() - started });
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? String(e);
    await supabase.from("crawl_runs").update({ finished_at: new Date().toISOString(), status: "failed", error: `${phase}: ${msg}`.slice(0, 2000) }).eq("id", run?.id);
    return Response.json({ phase, error: msg }, { status: 500 });
  }
});
