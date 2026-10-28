import { Bot, ChartColumn, CodeXml, FileText, FlaskConical, Palette, Server, Sparkles, Workflow } from "lucide-react"

/** Icono e ideas de uso para cada categoría. El vestuario de Nodo está en lib/nodo.js. */
export const CATEGORY_META = {
  development: {
    icon: CodeXml,
    prompts: ["Refactoriza este componente de React sin cambiar su comportamiento", "Crea un endpoint REST con validación y pruebas"],
  },
  testing: {
    icon: FlaskConical,
    prompts: ["Escribe pruebas para el flujo de inicio de sesión", "Encuentra la causa de este error antes de corregirlo"],
  },
  "ai-agents": {
    icon: Bot,
    prompts: ["Crea un servidor MCP para conectar mi API de inventario", "Reparte esta tarea entre varios subagentes"],
  },
  data: {
    icon: ChartColumn,
    prompts: ["Analiza este CSV de ventas y dime qué cambió este mes", "Investiga en la web y resume las fuentes con enlaces"],
  },
  devops: {
    icon: Server,
    prompts: ["Configura un pipeline de CI que corra las pruebas", "Audita este formulario contra inyecciones"],
  },
  design: {
    icon: Palette,
    prompts: ["Diseña una landing con una identidad visual propia", "Crea un tema de colores y tipografía para mis diapositivas"],
  },
  documents: {
    icon: FileText,
    prompts: ["Convierte estas notas en un informe en Word con índice", "Redacta el resumen semanal para el equipo"],
  },
  productivity: {
    icon: Workflow,
    prompts: ["Divide este proyecto en tareas con orden y dependencias", "Hagamos una lluvia de ideas antes de escribir código"],
  },
  other: {
    icon: Sparkles,
    prompts: ["Pregúntale a tu agente qué puede hacer con esta skill", "Pruébala con una tarea pequeña antes de usarla en serio"],
  },
}

export const categoryMeta = (slug) => CATEGORY_META[slug] ?? CATEGORY_META.other
export const MAIN_CATEGORIES = ["development", "testing", "ai-agents", "data", "devops", "design", "documents", "productivity"]
