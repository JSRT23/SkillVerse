import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown, FileCode2, FolderTree, ShieldCheck, Wand2 } from "lucide-react"
import Nodo from "../components/Nodo"
import { CommandLine } from "../components/ui"

const AGENTS = [
  { agent: "Claude Code", project: ".claude/skills/", personal: "~/.claude/skills/" },
  { agent: "Codex CLI", project: ".agents/skills/", personal: "~/.agents/skills/" },
  { agent: "GitHub Copilot", project: ".github/skills/", personal: "Según tu editor" },
  { agent: "Gemini CLI", project: ".gemini/skills/", personal: "~/.gemini/skills/" },
]

const FAQ = [
  {
    q: "¿Una skill es lo mismo que un servidor MCP?",
    a: "No. Un servidor MCP le da a tu agente acceso a herramientas o datos externos, como tu base de datos o tu calendario. Una skill le enseña cómo hacer un trabajo: pasos, criterios y archivos de apoyo. Se complementan.",
  },
  {
    q: "¿Tengo que activar la skill cada vez?",
    a: "No. Tu agente revisa el nombre y la descripción de las skills instaladas y carga la que encaja con lo que le pides. Si quieres forzar una, menciónala por su nombre.",
  },
  {
    q: "¿Instalar muchas skills hace más lento al agente?",
    a: "Muy poco: al principio solo se cargan los nombres y descripciones. El contenido completo entra solo cuando hace falta. Aun así, conviene instalar las que de verdad usas.",
  },
  {
    q: "¿Por qué varias skills tienen las mismas estrellas?",
    a: "GitHub da estrellas a repositorios, no a carpetas. Todas las skills de un mismo repositorio comparten su número de estrellas.",
  },
  {
    q: "¿Cómo se clasifican las skills?",
    a: "Un modelo de IA convierte la descripción de cada skill en un vector que representa su significado y la compara con la descripción de cada subcategoría. Gana la más parecida, con un pequeño refuerzo si el nombre contiene palabras clave. Por eso “pytest” cae en Pruebas unitarias aunque no diga “testing”.",
  },
  {
    q: "¿Qué hace la búsqueda inteligente?",
    a: "Combina la búsqueda por palabras con una búsqueda por significado. Si escribes “revisar mi código antes de publicarlo”, encuentra skills de revisión de código aunque no usen esas palabras exactas, y funciona aunque escribas en español y la skill esté en inglés.",
  },
  {
    q: "¿Cada cuánto se actualiza SkillVerse?",
    a: "Sin parar: un rastreador descubre repositorios nuevos en GitHub cada dos minutos y revisa la cola cada 20 segundos. Cuando aparece una skill nueva, la ves en el sitio sin recargar.",
  },
]

const ANATOMY = `mi-skill/
├── SKILL.md          ← nombre, descripción e instrucciones
├── scripts/          ← código que el agente puede ejecutar (opcional)
├── references/       ← documentación extra que lee si la necesita
└── assets/           ← plantillas, fuentes, imágenes`

const SKILL_MD = `---
name: informe-semanal
description: Redacta el informe semanal del equipo a partir de las notas
  de la reunión. Úsala cuando pidan el resumen o el informe de la semana.
---

# Informe semanal
1. Agrupa las notas por proyecto.
2. Escribe un párrafo por proyecto: avances, bloqueos y siguiente paso.
3. Termina con las decisiones pendientes.`

export default function Guide() {
  return (
    <div className="container-page max-w-4xl pt-10">
      <div className="flex flex-col-reverse items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold sm:text-[3.2rem]" style={{ letterSpacing: "-0.04em" }}>Guía de Agent Skills</h1>
          <p className="mt-3 max-w-xl text-lg text-muted">Qué son, cómo se instalan en cada agente y cómo usarlas sin riesgos.</p>
        </div>
        <Nodo size={140} hat="readers" prop="book" mood="happy" track title="Nodo con su libro de guía" />
      </div>

      <nav aria-label="En esta guía" className="mt-8 flex flex-wrap gap-2">
        {[["que-es", "Qué es"], ["instalar", "Instalar"], ["seguridad", "Seguridad"], ["crear", "Crear la tuya"], ["preguntas", "Preguntas"]].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="chip border-line bg-elev px-3.5 py-2 text-sm text-muted hover:text-fg">{label}</a>
        ))}
      </nav>

      <GuideSection id="que-es" icon={FolderTree} title="Qué es una skill">
        <p>
          Una skill es una carpeta con un archivo <code className="font-mono text-brand">SKILL.md</code>. Ese archivo tiene un nombre, una descripción de cuándo usarla e instrucciones paso a paso. Puede traer también scripts, plantillas o documentación.
        </p>
        <p>
          Es un formato abierto: la misma carpeta funciona en Claude Code, Codex, Copilot, Gemini CLI y otros agentes compatibles.
        </p>
        <pre className="overflow-x-auto rounded-2xl border border-line bg-[#0c0a20] p-5 font-mono text-[13px] leading-relaxed text-[#e9e6ff]">{ANATOMY}</pre>
      </GuideSection>

      <GuideSection id="instalar" icon={Wand2} title="Cómo instalarla">
        <p>La forma más rápida es la herramienta <code className="font-mono text-brand">skills</code>, que detecta tu agente y copia la skill al lugar correcto:</p>
        <CommandLine command="npx skills add anthropics/skills --skill pdf" />
        <p>También puedes copiar la carpeta a mano. Cada agente busca las skills en una carpeta distinta:</p>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-soft text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Agente</th>
                <th className="px-4 py-3 font-semibold">Solo un proyecto</th>
                <th className="px-4 py-3 font-semibold">Todos tus proyectos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {AGENTS.map((a) => (
                <tr key={a.agent} className="transition-colors hover:bg-soft">
                  <td className="px-4 py-3 font-semibold">{a.agent}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-teal">{a.project}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-muted">{a.personal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted">Las rutas pueden cambiar entre versiones; confírmalas en la documentación de tu agente.</p>
      </GuideSection>

      <GuideSection id="seguridad" icon={ShieldCheck} title="Úsalas con seguridad">
        <ul className="space-y-3">
          {[
            "Prefiere skills oficiales o de autores que conoces. En SkillVerse las ves marcadas como Oficial o Comunidad.",
            "Si la ficha dice que incluye scripts, ábrelos en GitHub antes de instalar: tu agente podrá ejecutarlos en tu equipo.",
            "Lee el SKILL.md completo. Si te pide enviar datos a sitios desconocidos o desactivar protecciones, no la instales.",
            "Revisa las actualizaciones: una skill segura hoy puede cambiar mañana.",
          ].map((t) => (
            <li key={t} className="flex gap-3"><FileCode2 size={18} className="mt-0.5 shrink-0 text-amber-deep" aria-hidden />{t}</li>
          ))}
        </ul>
      </GuideSection>

      <GuideSection id="crear" icon={Wand2} title="Crea la tuya">
        <p>Solo necesitas una carpeta con un SKILL.md. La descripción es lo más importante: dile al agente qué hace y cuándo usarla.</p>
        <pre className="overflow-x-auto rounded-2xl border border-line bg-[#0c0a20] p-5 font-mono text-[13px] leading-relaxed text-[#e9e6ff]">{SKILL_MD}</pre>
        <p>Si usas Claude, la skill <code className="font-mono text-brand">skill-creator</code> te guía con preguntas y prueba tu skill antes de publicarla.</p>
      </GuideSection>

      <section id="preguntas" className="scroll-mt-24 pt-14">
        <h2 className="section-title">Preguntas frecuentes</h2>
        <div className="mt-6 space-y-3">
          {FAQ.map((f) => <FaqItem key={f.q} {...f} />)}
        </div>
      </section>
    </div>
  )
}

function GuideSection({ id, icon: Icon, title, children }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      className="scroll-mt-24 pt-14"
    >
      <h2 className="section-title flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/15 text-brand"><Icon size={20} aria-hidden /></span>
        {title}
      </h2>
      <div className="mt-5 space-y-4 leading-relaxed text-fg/90">{children}</div>
    </motion.section>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold cursor-pointer">
        {q}
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="shrink-0 text-brand"><ChevronDown size={18} /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
            <p className="px-5 pb-5 leading-relaxed text-muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
