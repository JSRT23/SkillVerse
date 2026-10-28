# SkillVerse

Directorio independiente de **Agent Skills** (formato `SKILL.md`). Muestra qué hace cada skill, cuántas estrellas tiene su repositorio en GitHub y cómo instalarla. El catálogo se actualiza solo y los cambios llegan al sitio en tiempo real.

Su mascota es **Nodo**, una araña-agente que teje la red de categorías y se viste distinto para cada una.

## Arrancar con Docker

```bash
docker compose up --build
```

Abre http://localhost:8080. No hace falta configurar nada: las claves públicas de Supabase vienen por defecto.

Para usar otro puerto: `PORT=3000 docker compose up --build`.

## Desarrollo local

```bash
cp .env.example .env
npm install
npm run dev
```

## Qué incluye

- **Inicio**: telaraña interactiva de categorías, skills populares, recién llegadas, repos en tendencia y guía rápida de instalación.
- **Explorar**: búsqueda instantánea, filtros por categoría, origen (oficial o comunidad) y skills sin scripts. Los filtros quedan en la URL.
- **Ficha de cada skill**: se abre como modal y también tiene URL propia para compartir. Incluye comandos de instalación para tres casos, avisos de seguridad y ejemplos de uso.
- **Buscador rápido**: `Ctrl + K` (o `/`) desde cualquier página.
- **Tiempo real**: cuando el rastreador encuentra una skill nueva aparece un aviso y el catálogo se refresca solo.
- **Conoce a Nodo**: la mascota con sus 11 accesorios y 4 estados de ánimo.
- **Guía**: qué es una skill, cómo instalarla en cada agente, seguridad y preguntas frecuentes.

## Stack

| Parte | Tecnología |
|---|---|
| Interfaz | React 19 + Vite (JavaScript) |
| Estilos | Tailwind CSS 4 |
| Animaciones | Motion |
| Iconos | Lucide |
| Datos | Supabase (Postgres, Realtime, Edge Functions, pg_cron) + TanStack Query |
| Rutas | React Router |
| Servidor | Nginx en Docker |

Las fuentes (Unbounded, Manrope y JetBrains Mono) se sirven desde el propio sitio.

## Backend (Supabase)

El backend ya está desplegado en el proyecto `yklvcnoiblejvmjnqqjy`:

- **`supabase/functions/crawl-skills`**: Edge Function que lee los repositorios de la tabla `sources`, encuentra cada `SKILL.md`, extrae nombre y descripción, la clasifica, guarda estrellas e historial y marca duplicados.
- **pg_cron** la ejecuta cada 30 minutos.
- **RLS**: el público solo puede leer el catálogo.

### Agregar repositorios al rastreo

En el SQL Editor de Supabase:

```sql
insert into public.sources (full_name, trust) values ('usuario/repo', 'community');
select public.trigger_crawl(); -- opcional: rastrear ya
```

### Token de GitHub (recomendado)

Sin token, GitHub permite 60 consultas por hora. Crea un token de solo lectura y guárdalo en Supabase en **Edge Functions → Secrets** con el nombre `GITHUB_TOKEN`.

### Traer las migraciones como archivos

```bash
npx supabase link --project-ref yklvcnoiblejvmjnqqjy
npx supabase migration fetch
```

## Skills incluidas para trabajar en este repo

En `.claude/skills/` hay tres skills que usan los agentes compatibles al trabajar en este proyecto:

- `frontend-design` (Anthropic, Apache 2.0): criterios de diseño de interfaces.
- `webapp-testing` (Anthropic, Apache 2.0): pruebas del sitio con Playwright.
- `supabase` (Supabase, MIT): buenas prácticas de Supabase.

## Aviso

SkillVerse no está afiliado a Anthropic ni a ningún proveedor de agentes. Cada skill pertenece a su autor y conserva su licencia; el sitio muestra un resumen y enlaza al original.
