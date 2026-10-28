// SkillVerse — clasificación con IA
// Calcula el embedding de cada skill con gte-small (integrado en Supabase) y la asigna a la
// subcategoría más parecida, con un pequeño refuerzo por palabras clave del nombre.
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
// @ts-ignore Supabase.ai existe en el runtime de Edge Functions
const model = new Supabase.ai.Session("gte-small");

// Supabase limita ~2 s de CPU por ejecución: 5 skills por llamada, una llamada cada 5 s
const BATCH = 5;
const MIN_SIMILARITY = 0.76; // por debajo, la skill va a "Otras"

type Sub = { id: number; category_id: number; slug: string; prototype: string; keywords: string[]; vec: number[] };

const embed = async (text: string) =>
  (await model.run(text, { mean_pool: true, normalize: true })) as number[];
const dot = (a: number[], b: number[]) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const tokens = (t: string) => new Set(t.toLowerCase().split(/[^a-z0-9+#.]+/).filter(Boolean));

/** Carga las subcategorías. Si faltan embeddings, calcula unos pocos y avisa que no están listas. */
async function loadSubcategories(): Promise<{ subs: Sub[]; ready: boolean }> {
  const { data, error } = await supabase.rpc("subcategory_vectors");
  if (error) throw error;
  const subs: Sub[] = [];
  let computed = 0;
  let ready = true;
  for (const s of data ?? []) {
    let vec: number[] = s.embedding ? JSON.parse(s.embedding) : [];
    if (!vec.length) {
      ready = false;
      if (computed >= BATCH) continue;
      vec = await embed(s.prototype);
      computed++;
      await supabase.rpc("set_subcategory_embedding", { p_id: s.id, p_embedding: JSON.stringify(vec) });
    }
    subs.push({ id: s.id, category_id: s.category_id, slug: s.slug, prototype: s.prototype, keywords: s.keywords ?? [], vec });
  }
  return { subs, ready: ready || computed === 0 };
}

function classify(vec: number[], name: string, description: string, subs: Sub[], lockedCategory: number | null) {
  const nameWords = tokens(name.replace(/[-_]/g, " "));
  const descWords = tokens(description);
  let best: Sub | null = null;
  let bestScore = -1, bestSim = -1;
  for (const s of subs) {
    if (lockedCategory && s.category_id !== lockedCategory) continue;
    const sim = dot(vec, s.vec);
    let boost = 0;
    for (const k of s.keywords) {
      if (nameWords.has(k)) boost += 0.025;
      else if (descWords.has(k)) boost += 0.008;
    }
    const score = sim + Math.min(boost, 0.06);
    if (score > bestScore) { bestScore = score; bestSim = sim; best = s; }
  }
  if (!best || (!lockedCategory && bestSim < MIN_SIMILARITY)) return { subcategory_id: null, score: bestSim };
  return { subcategory_id: best.id, score: bestSim };
}

Deno.serve(async (req) => {
  const { data: ok } = await supabase.rpc("verify_crawl_secret", { p_secret: req.headers.get("x-crawl-secret") ?? "" });
  if (!ok) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const started = Date.now();
  const { subs, ready } = await loadSubcategories();
  if (!ready) return Response.json({ preparing_subcategories: true });

  const { data: rows, error } = await supabase.rpc("claim_unclassified", { p_limit: BATCH });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!rows?.length) return Response.json({ classified: 0 });

  const results = [];
  for (const r of rows) {
    const text = `${r.name.replace(/[-_]/g, " ")}: ${r.description ?? ""}`.slice(0, 1500);
    const vec = await embed(text);
    const c = classify(vec, r.name, r.description ?? "", subs, r.category_locked ? r.category_id : null);
    results.push({ id: r.id, embedding: JSON.stringify(vec), subcategory_id: c.subcategory_id, score: c.score });
  }
  const { error: e2 } = await supabase.rpc("apply_classification", { p_rows: results });
  if (e2) return Response.json({ error: e2.message }, { status: 500 });
  const classified = results.length;

  return Response.json({ classified, ms: Date.now() - started });
});
