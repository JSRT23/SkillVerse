// SkillVerse crawler: reads SKILL.md files from the GitHub repos listed in `sources`,
// extracts metadata, classifies them and stores repos, skills and daily star snapshots.
import { createClient } from "npm:@supabase/supabase-js@2";
import { parse as parseYaml } from "npm:yaml@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");

type Category = { id: number; slug: string; keywords: string[]; sort_order: number };
type TreeItem = { path: string; type: "blob" | "tree"; sha: string };

const reservedSlugs = new Set<string>(); // reset on every run
const SCRIPT_EXT = /\.(py|sh|bash|js|mjs|cjs|ts|rb|ps1|go)$/i;
const IGNORED = /(^|\/)(node_modules|\.git|\.github|template|templates|test|tests|fixtures|examples?)\//i;

function gh(path: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "skillverse-crawler",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return fetch(`https://api.github.com${path}`, { headers });
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function encodePath(p: string) {
  return p.split("/").map(encodeURIComponent).join("/");
}

function parseSkillMd(md: string) {
  let meta: Record<string, unknown> = {};
  let body = md;
  const m = md.match(/^\uFEFF?---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  if (m) {
    body = md.slice(m[0].length);
    try {
      const parsed = parseYaml(m[1]);
      if (parsed && typeof parsed === "object") meta = parsed as Record<string, unknown>;
    } catch {
      for (const line of m[1].split(/\r?\n/)) {
        const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
        if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
      }
    }
  }
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : undefined);
  let description = str(meta.description) ?? "";
  if (!description) {
    const para = body
      .split(/\r?\n\s*\r?\n/)
      .map((p) => p.trim())
      .find((p) => p && !p.startsWith("#") && !p.startsWith("```"));
    description = (para ?? "").replace(/[*_`>#\[\]]/g, "").replace(/\s+/g, " ");
  }
  return {
    name: str(meta.name),
    description: description.replace(/\s+/g, " ").slice(0, 600),
    license: str(meta.license),
  };
}

// Keyword scoring: words in the skill name/folder count 3x, description words 1x.
function classify(name: string, description: string, categories: Category[]) {
  const tokenize = (t: string) => new Set(t.toLowerCase().split(/[^a-z0-9+#.]+/).filter(Boolean));
  const nameWords = tokenize(name);
  const descWords = tokenize(description);
  let best: Category | undefined;
  let bestScore = 0;
  for (const c of categories) {
    if (!c.keywords.length) continue;
    const score = c.keywords.reduce(
      (n, k) => n + (nameWords.has(k) ? 3 : 0) + (descWords.has(k) ? 1 : 0),
      0,
    );
    if (score > bestScore || (score === bestScore && score > 0 && best && c.sort_order < best.sort_order)) {
      best = c;
      bestScore = score;
    }
  }
  return (best ?? categories.find((c) => c.slug === "other"))?.id ?? null;
}

async function pool<T, R>(items: T[], size: number, fn: (t: T) => Promise<R>) {
  const out: R[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

async function crawlSource(
  source: { id: number; full_name: string; trust: string },
  categories: Category[],
) {
  const repoRes = await gh(`/repos/${source.full_name}`);
  if (!repoRes.ok) throw new Error(`GitHub ${repoRes.status} al leer ${source.full_name}`);
  const r = await repoRes.json();

  const { error: repoErr } = await supabase.from("repos").upsert({
    id: r.id,
    full_name: r.full_name,
    owner: r.owner.login,
    owner_avatar_url: r.owner.avatar_url,
    name: r.name,
    description: r.description,
    html_url: r.html_url,
    homepage: r.homepage || null,
    default_branch: r.default_branch,
    stars: r.stargazers_count,
    forks: r.forks_count,
    license: r.license?.spdx_id && r.license.spdx_id !== "NOASSERTION" ? r.license.spdx_id : null,
    topics: r.topics ?? [],
    trust: source.trust,
    pushed_at: r.pushed_at,
  });
  if (repoErr) throw repoErr;

  await supabase.from("star_snapshots").upsert(
    { repo_id: r.id, captured_on: new Date().toISOString().slice(0, 10), stars: r.stargazers_count },
    { onConflict: "repo_id,captured_on" },
  );

  const treeRes = await gh(`/repos/${r.full_name}/git/trees/${encodeURIComponent(r.default_branch)}?recursive=1`);
  if (!treeRes.ok) throw new Error(`GitHub ${treeRes.status} al leer el árbol de ${r.full_name}`);
  const tree = await treeRes.json();
  const items: TreeItem[] = tree.tree ?? [];
  const blobs = items.filter((t) => t.type === "blob");

  const skillFiles = blobs.filter(
    (b) => (b.path === "SKILL.md" || b.path.endsWith("/SKILL.md")) && !IGNORED.test(b.path),
  );

  const { data: existingRows } = await supabase
    .from("skills")
    .select("id, path, content_sha, slug, category_locked")
    .eq("repo_id", r.id);
  const existing = new Map((existingRows ?? []).map((e) => [e.path, e]));

  let added = 0;
  const foundPaths: string[] = [];

  await pool(skillFiles, 8, async (file) => {
    const dir = file.path.includes("/") ? file.path.slice(0, file.path.lastIndexOf("/")) : "";
    foundPaths.push(dir);
    const prefix = dir ? dir + "/" : "";
    const inDir = blobs.filter((b) => b.path.startsWith(prefix));
    const hasScripts = inDir.some((b) => SCRIPT_EXT.test(b.path));
    const prev = existing.get(dir);

    const htmlUrl = `${r.html_url}/tree/${encodeURIComponent(r.default_branch)}/${encodePath(dir)}`;
    const rawUrl = `https://raw.githubusercontent.com/${r.full_name}/${encodeURIComponent(r.default_branch)}/${encodePath(file.path)}`;

    if (prev && prev.content_sha === file.sha) {
      await supabase
        .from("skills")
        .update({ has_scripts: hasScripts, file_count: inDir.length, html_url: htmlUrl, raw_url: rawUrl })
        .eq("id", prev.id);
      return;
    }

    const rawRes = await fetch(rawUrl);
    if (!rawRes.ok) return;
    const parsed = parseSkillMd(await rawRes.text());
    const folder = dir.split("/").pop() || r.name;
    const name = (parsed.name || folder).slice(0, 120);

    let slug = prev?.slug;
    if (!slug) {
      const candidates = [
        slugify(`${r.owner.login}-${name}`),
        slugify(`${r.owner.login}-${r.name}-${name}`),
        slugify(`${r.owner.login}-${r.name}-${dir}`),
      ];
      for (const c of candidates) {
        if (reservedSlugs.has(c)) continue;
        reservedSlugs.add(c);
        const { count } = await supabase.from("skills").select("id", { count: "exact", head: true }).eq("slug", c);
        if (!count) { slug = c; break; }
      }
      slug ??= `${candidates[2]}-${file.sha.slice(0, 6)}`;
      reservedSlugs.add(slug);
    }

    const row: Record<string, unknown> = {
        repo_id: r.id,
        path: dir,
        slug,
        name,
        description: parsed.description,
        license: parsed.license ?? null,
        has_scripts: hasScripts,
        file_count: inDir.length,
        content_sha: file.sha,
        html_url: htmlUrl,
        raw_url: rawUrl,
        install_command: `npx skills add ${r.full_name} --skill ${name}`,
    };
    if (!prev?.category_locked) {
      row.category_id = classify(`${name} ${folder.replace(/[-_]/g, " ")}`, parsed.description, categories);
    }
    const { error } = await supabase.from("skills").upsert(row, { onConflict: "repo_id,path" });
    if (error) throw error;
    if (!prev) added++;
  });

  // Remove skills that no longer exist in the repo (only when we saw the full tree)
  if (!tree.truncated) {
    const gone = [...existing.keys()].filter((p) => !foundPaths.includes(p));
    if (gone.length) await supabase.from("skills").delete().eq("repo_id", r.id).in("path", gone);
  }

  return { found: skillFiles.length, added };
}

Deno.serve(async (req) => {
  const secret = req.headers.get("x-crawl-secret") ?? "";
  const { data: ok } = await supabase.rpc("verify_crawl_secret", { p_secret: secret });
  if (!ok) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  reservedSlugs.clear();

  const { data: run } = await supabase.from("crawl_runs").insert({}).select("id").single();
  const { data: categories } = await supabase.from("categories").select("id, slug, keywords, sort_order");
  const { data: sources } = await supabase
    .from("sources")
    .select("id, full_name, trust")
    .eq("enabled", true)
    .order("id");

  let scanned = 0, found = 0, added = 0;
  const errors: string[] = [];

  for (const source of sources ?? []) {
    try {
      const res = await crawlSource(source, (categories ?? []) as Category[]);
      scanned++;
      found += res.found;
      added += res.added;
      await supabase.from("sources")
        .update({ last_crawled_at: new Date().toISOString(), last_error: null })
        .eq("id", source.id);
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? String(e);
      errors.push(`${source.full_name}: ${msg}`);
      await supabase.from("sources")
        .update({ last_crawled_at: new Date().toISOString(), last_error: msg.slice(0, 500) })
        .eq("id", source.id);
    }
  }

  const { data: duplicates } = await supabase.rpc("mark_duplicates");

  const status = errors.length === 0 ? "success" : scanned > 0 ? "partial" : "failed";
  await supabase.from("crawl_runs").update({
    finished_at: new Date().toISOString(),
    status,
    repos_scanned: scanned,
    skills_found: found,
    skills_new: added,
    error: errors.length ? errors.join("\n").slice(0, 2000) : null,
  }).eq("id", run?.id);

  return new Response(
    JSON.stringify({ status, repos_scanned: scanned, skills_found: found, skills_new: added, duplicates_changed: duplicates, errors }),
    { headers: { "Content-Type": "application/json" } },
  );
});
