import {
  FileText, Palette, CodeXml, FlaskConical, Bot, ChartColumn, Workflow,
  MessageSquare, Cloud, Shield, Sparkles,
} from "lucide-react"

/** Icono, accesorio de la mascota e ideas de uso para cada categoría. */
export const CATEGORY_META = {
  documents: {
    icon: FileText,
    outfit: "glasses",
    prompts: ["Convierte estas notas en un informe en Word con índice", "Une estos tres PDF y extrae las tablas a Excel"],
  },
  design: {
    icon: Palette,
    outfit: "beret",
    prompts: ["Diseña un póster para el lanzamiento con una paleta original", "Crea un tema visual coherente para mis diapositivas"],
  },
  development: {
    icon: CodeXml,
    outfit: "headphones",
    prompts: ["Refactoriza este módulo sin cambiar su comportamiento", "Encuentra por qué falla este endpoint y corrígelo"],
  },
  testing: {
    icon: FlaskConical,
    outfit: "goggles",
    prompts: ["Escribe pruebas para el flujo de inicio de sesión", "Revisa este pull request antes de que lo fusione"],
  },
  "ai-agents": {
    icon: Bot,
    outfit: "antenna",
    prompts: ["Crea un servidor MCP para conectar mi API de inventario", "Ayúdame a escribir una skill nueva para mi equipo"],
  },
  data: {
    icon: ChartColumn,
    outfit: "magnifier",
    prompts: ["Analiza este CSV de ventas y dime qué cambió este mes", "Escribe la consulta SQL para el reporte semanal"],
  },
  productivity: {
    icon: Workflow,
    outfit: "clipboard",
    prompts: ["Divide este proyecto en tareas con orden y dependencias", "Hagamos una lluvia de ideas antes de escribir código"],
  },
  communication: {
    icon: MessageSquare,
    outfit: "headset",
    prompts: ["Redacta el resumen semanal para el equipo", "Escribe juntos la documentación de esta función"],
  },
  devops: {
    icon: Cloud,
    outfit: "hardhat",
    prompts: ["Configura un pipeline de CI que corra las pruebas", "Prepara el despliegue de esta app en contenedores"],
  },
  security: {
    icon: Shield,
    outfit: "shield",
    prompts: ["Audita este formulario contra inyecciones", "Revisa si hay secretos expuestos en el repositorio"],
  },
  other: {
    icon: Sparkles,
    outfit: "party",
    prompts: ["Pregúntale a tu agente qué puede hacer con esta skill", "Pruébala con una tarea pequeña antes de usarla en serio"],
  },
}

export function categoryMeta(slug) {
  return CATEGORY_META[slug] ?? CATEGORY_META.other
}
