import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown, FileCode2, FolderTree, ShieldCheck, Wand2 } from "lucide-react"
import Mascot from "../components/Mascot"
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
    q: "¿Cada cuánto se actualiza SkillVerse?",
    a: "El rastreador revisa los repositorios cada 30 minutos. Cuando encuentra una skill nueva, aparece en el sitio sin que tengas que recargar.",
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
          <h1 className="text-4xl font-bold sm:text-5xl">Guía de Agent Skills</h1>
          <p className="mt-3 max-w-xl text-lg text-haze">Qué son, cómo se instalan en cada agente y cómo usarlas sin riesgos.</p>
        </div>
        <Mascot size={130} outfit="glasses" accent="#3B82F6" mood="happy" />
      </div>

      <nav aria-label="En esta guía" className="mt-8 flex flex-wrap gap-2">
        {[["que-es", "Qué es"], ["instalar", "Instalar"], ["seguridad", "Seguridad"], ["crear", "Crear la tuya"], ["preguntas", "Preguntas"]].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="chip border-line bg-dusk/60 px-3.5 py-2 text-sm text-haze hover:text-silk">{label}</a>
        ))}
      </nav>

      <GuideSection id="que-es" icon={FolderTree} title="Qué es una skill">
        <p>
          Una skill es una carpeta con un archivo <code className="font-mono text-amber">SKILL.md</code>. Ese archivo tiene un nombre, una descripción de cuándo usarla e instrucciones paso a paso. Puede traer también scripts, plantillas o documentación.
        </p>
        <p>
          Es un formato abierto: la misma carpeta funciona en Claude Code, Codex, Copilot, Gemini CLI y otros agentes compatibles.
        </p>
        <pre className="overflow-x-auto rounded-2xl border border-line bg-ink-deep/80 p-5 font-mono text-[13px] leading-relaxed text-silk/90">{ANATOMY}</pre>
      </GuideSection>

      <GuideSection id="instalar" icon={Wand2} title="Cómo instalarla">
        <p>La forma más rápida es la herramienta <code className="font-mono text-amber">skills</code>, que detecta tu agente y copia la skill al lugar correcto:</p>
        <CommandLine command="npx skills add anthropics/skills --skill pdf" />
        <p>También puedes copiar la carpeta a mano. Cada agente busca las skills en una carpeta distinta:</p>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-dusk-2/70 text-haze">
              <tr>
                <th className="px-4 py-3 font-semibold">Agente</th>
                <th className="px-4 py-3 font-semibold">Solo un proyecto</th>
                <th className="px-4 py-3 font-semibold">Todos tus proyectos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {AGENTS.map((a) => (
                <tr key={a.agent} className="transition-colors hover:bg-dusk-2/40">
                  <td className="px-4 py-3 font-semibold">{a.agent}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-lagoon">{a.project}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-haze">{a.personal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-haze">Las rutas pueden cambiar entre versiones; confírmalas en la documentación de tu agente.</p>
      </GuideSection>

      <GuideSection id="seguridad" icon={ShieldCheck} title="Úsalas con seguridad">
        <ul className="space-y-3">
          {[
            "Prefiere skills oficiales o de autores que conoces. En SkillVerse las ves marcadas como Oficial o Comunidad.",
            "Si la ficha dice que incluye scripts, ábrelos en GitHub antes de instalar: tu agente podrá ejecutarlos en tu equipo.",
            "Lee el SKILL.md completo. Si te pide enviar datos a sitios desconocidos o desactivar protecciones, no la instales.",
            "Revisa las actualizaciones: una skill segura hoy puede cambiar mañana.",
          ].map((t) => (
            <li key={t} className="flex gap-3"><FileCode2 size={18} className="mt-0.5 shrink-0 text-amber" aria-hidden />{t}</li>
          ))}
        </ul>
      </GuideSection>

      <GuideSection id="crear" icon={Wand2} title="Crea la tuya">
        <p>Solo necesitas una carpeta con un SKILL.md. La descripción es lo más importante: dile al agente qué hace y cuándo usarla.</p>
        <pre className="overflow-x-auto rounded-2xl border border-line bg-ink-deep/80 p-5 font-mono text-[13px] leading-relaxed text-silk/90">{SKILL_MD}</pre>
        <p>Si usas Claude, la skill <code className="font-mono text-amber">skill-creator</code> te guía con preguntas y prueba tu skill antes de publicarla.</p>
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
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet/20 text-violet"><Icon size={20} aria-hidden /></span>
        {title}
      </h2>
      <div className="mt-5 space-y-4 leading-relaxed text-silk/90">{children}</div>
    </motion.section>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="panel overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold cursor-pointer">
        {q}
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="shrink-0 text-amber"><ChevronDown size={18} /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
            <p className="px-5 pb-5 leading-relaxed text-haze">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
