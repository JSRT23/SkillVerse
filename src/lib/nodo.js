/** Vestuario de Nodo: un gorro por categoría y un objeto por subcategoría. */

export const CATEGORY_HAT = {
  development: "headphones",
  testing: "goggles",
  "ai-agents": "antenna",
  data: "glasses",
  devops: "hardhat",
  design: "beret",
  documents: "readers",
  productivity: "cap",
}

/** Objeto que lleva cuando solo se conoce la categoría. */
export const CATEGORY_PROP = {
  development: "browser",
  testing: "flask",
  "ai-agents": "plug",
  data: "magnifier",
  devops: "shield",
  design: "brush",
  documents: "paper",
  productivity: "clipboard",
}

export const SUBCATEGORY_PROP = {
  // Desarrollo
  architecture: "blocks",
  backend: "server",
  frontend: "browser",
  git: "branch",
  languages: "braces",
  mobile: "phone",
  // Testing y calidad
  "code-review": "check",
  debugging: "bug",
  e2e: "play",
  performance: "stopwatch",
  "unit-tests": "flask",
  // IA y agentes
  "llm-apps": "chat",
  mcp: "plug",
  orchestration: "network",
  prompting: "sparkle",
  "skill-authoring": "puzzle",
  // Datos e investigación
  analysis: "barchart",
  databases: "database",
  ml: "chip",
  research: "magnifier",
  visualization: "piechart",
  // DevOps y seguridad
  cicd: "gear",
  cloud: "cloud",
  observability: "pulse",
  security: "shield",
  // Diseño y creatividad
  branding: "palette",
  media: "film",
  "ui-ux": "layout",
  "visual-art": "brush",
  // Documentos y contenido
  marketing: "megaphone",
  office: "paper",
  "tech-docs": "book",
  writing: "pencil",
  // Productividad y negocio
  automation: "bolt",
  business: "coin",
  learning: "bulb",
  planning: "clipboard",
}

export const HAT_LABEL = {
  headphones: "Audífonos",
  goggles: "Gafas de laboratorio",
  antenna: "Antena",
  glasses: "Gafas redondas",
  hardhat: "Casco de obra",
  beret: "Boina",
  readers: "Lentes de lectura",
  cap: "Gorra",
}

export const MOODS = [
  { id: "idle", label: "Normal", hint: "Respira y parpadea" },
  { id: "happy", label: "Feliz", hint: "Sonríe y se balancea" },
  { id: "celebrate", label: "Celebrando", hint: "Salta con confeti" },
  { id: "angry", label: "Enojado", hint: "Tiembla y echa vapor" },
  { id: "sad", label: "Triste", hint: "Se agacha y llora" },
  { id: "surprised", label: "Sorprendido", hint: "Brinca con un !" },
  { id: "thinking", label: "Pensando", hint: "Mira arriba con puntos" },
  { id: "sleep", label: "Durmiendo", hint: "Ronca con zetas" },
  { id: "walk", label: "Caminando", hint: "Mueve las ocho patas" },
  { id: "love", label: "Enamorado", hint: "Le sale un corazón" },
]

/** Resuelve el gorro y el objeto a partir de categoría y subcategoría. */
export function outfitFor(category, subcategory) {
  return {
    hat: CATEGORY_HAT[category] ?? null,
    prop: (subcategory && SUBCATEGORY_PROP[subcategory]) || CATEGORY_PROP[category] || null,
  }
}
