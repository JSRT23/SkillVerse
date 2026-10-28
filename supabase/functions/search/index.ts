// SkillVerse — búsqueda inteligente (texto + significado)
// El modelo gte-small entiende inglés, y casi todas las skills están en inglés, así que la
// consulta se traduce con un glosario del dominio antes de buscar.
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
// @ts-ignore Supabase.ai existe en el runtime de Edge Functions
const model = new Supabase.ai.Session("gte-small");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Frases primero (más específicas), luego palabras sueltas
const PHRASES: [string, string][] = [
  ["base de datos", "database"], ["bases de datos", "databases"], ["control de versiones", "version control git"],
  ["pull request", "pull request"], ["revision de codigo", "code review"], ["pruebas unitarias", "unit tests"],
  ["de extremo a extremo", "end to end"], ["inteligencia artificial", "ai"], ["aprendizaje automatico", "machine learning"],
  ["lluvia de ideas", "brainstorming"], ["hoja de calculo", "spreadsheet excel"], ["hojas de calculo", "spreadsheets excel"],
  ["linea de comandos", "cli command line"], ["interfaz de usuario", "user interface ui"], ["experiencia de usuario", "ux user experience"],
  ["redes sociales", "social media"], ["correo electronico", "email"], ["sitio web", "website"], ["pagina web", "web page"],
  ["paginas web", "web pages"], ["integracion continua", "continuous integration ci"], ["casos de prueba", "test cases"],
];
const WORDS: Record<string, string> = {
  revisar: "review", revision: "review", revisa: "review", codigo: "code", publicar: "publish release", publicarlo: "publish release",
  probar: "test", prueba: "test", pruebas: "tests testing", testear: "test", depurar: "debug", depuracion: "debugging", error: "error bug",
  errores: "errors bugs", fallo: "bug failure", arreglar: "fix", corregir: "fix", mejorar: "improve", optimizar: "optimize performance",
  rendimiento: "performance", velocidad: "speed performance", seguridad: "security", vulnerabilidad: "vulnerability", vulnerabilidades: "vulnerabilities",
  autenticacion: "authentication auth", contraseñas: "passwords", secretos: "secrets", auditar: "audit", auditoria: "audit",
  diseño: "design", diseno: "design", disenar: "design", diseñar: "design", interfaz: "interface ui", interfaces: "interfaces ui",
  colores: "colors palette", tipografia: "typography fonts", marca: "brand", logo: "logo", animacion: "animation", animaciones: "animations",
  video: "video", videos: "videos", audio: "audio", musica: "music", imagen: "image", imagenes: "images", grafico: "chart graphic", graficos: "charts graphics",
  documento: "document", documentos: "documents", informe: "report", informes: "reports", presentacion: "presentation slides",
  presentaciones: "presentations slides", diapositivas: "slides", tabla: "table", tablas: "tables", hoja: "sheet", word: "word docx", excel: "excel xlsx",
  escribir: "write writing", redactar: "write writing", redaccion: "writing", documentacion: "documentation docs", traducir: "translate",
  resumen: "summary", resumir: "summarize", articulo: "article", articulos: "articles", blog: "blog", correo: "email", correos: "emails",
  datos: "data", analizar: "analyze analysis", analisis: "analysis", consulta: "query", consultas: "queries", visualizar: "visualize chart",
  investigar: "research", investigacion: "research", buscar: "search", busqueda: "search", web: "web", raspar: "scrape",
  desplegar: "deploy", despliegue: "deployment", nube: "cloud", servidor: "server", servidores: "servers", contenedores: "containers docker",
  monitoreo: "monitoring", registros: "logs", agente: "agent", agentes: "agents", subagentes: "subagents", modelo: "model", modelos: "models",
  planificar: "plan planning", planificacion: "planning", plan: "plan", tareas: "tasks", tarea: "task", proyecto: "project", proyectos: "projects",
  automatizar: "automate automation", automatizacion: "automation", flujo: "workflow", notas: "notes", calendario: "calendar",
  aprender: "learn learning", enseñar: "teach", ensenar: "teach", curso: "course", cursos: "courses", negocio: "business", finanzas: "finance",
  ventas: "sales", marketing: "marketing", contenido: "content", movil: "mobile", aplicacion: "app application", aplicaciones: "apps applications",
  componente: "component", componentes: "components", migrar: "migrate migration", refactorizar: "refactor", limpiar: "clean",
  crear: "create build", construir: "build", generar: "generate", convertir: "convert", unir: "merge", combinar: "combine merge",
  extraer: "extract", formulario: "form", formularios: "forms", navegador: "browser", pantalla: "screen", capturas: "screenshots",
};
const STOP = new Set(["el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al", "a", "en", "y", "o", "que", "con", "por", "para",
  "mi", "mis", "tu", "tus", "su", "sus", "me", "te", "se", "lo", "le", "les", "es", "son", "como", "antes", "despues", "quiero", "necesito",
  "hacer", "algo", "este", "esta", "estos", "estas", "ese", "esa", "muy", "mas", "sin", "sobre", "entre", "cuando", "donde", "skill", "skills"]);

const strip = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ñ/g, "n");

function translate(q: string) {
  let text = " " + strip(q).replace(/[^\p{L}\p{N}\s.+#-]/gu, " ") + " ";
  for (const [es, en] of PHRASES) text = text.replaceAll(` ${strip(es)} `, ` ${en} `);
  const terms: string[] = [];
  for (const w of text.split(/\s+/).filter(Boolean)) {
    if (STOP.has(w)) continue;
    const t = WORDS[w] ?? WORDS[w.replace(/(lo|la|los|las)$/, "")] ?? w;
    terms.push(...t.split(" "));
  }
  return [...new Set(terms)].slice(0, 12);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const body = await req.json().catch(() => ({}));
    const raw = String(body.q ?? "").trim().slice(0, 200);
    if (raw.length < 2) return Response.json([], { headers: CORS });

    const terms = translate(raw);
    const english = terms.join(" ") || raw;
    const vec = (await model.run(english, { mean_pool: true, normalize: true })) as number[];
    const { data, error } = await supabase.rpc("hybrid_search", {
      q: terms.length > 1 ? terms.join(" or ") : english,
      q_embedding: JSON.stringify(vec),
      category: body.category || null,
      subcategory: body.subcategory || null,
      origin: body.origin || null,
      no_scripts: !!body.no_scripts,
      lim: Math.min(Number(body.lim) || 24, 60),
    });
    if (error) throw error;
    return Response.json(data ?? [], { headers: { ...CORS, "Cache-Control": "public, max-age=60" } });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500, headers: CORS });
  }
});
