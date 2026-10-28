# SkillVerse

Directorio independiente de **Agent Skills** (formato `SKILL.md`) con miles de skills descubiertas automáticamente en GitHub, **clasificadas con IA en 8 categorías y 37 subcategorías**, con búsqueda inteligente y actualización en tiempo real.

Su mascota es **Ocho**, un pulpo con un tentáculo para cada categoría.

## Arrancar con Docker

```bash
docker compose up --build
```

Abre http://localhost:8080. No hace falta configurar nada: las claves públicas de Supabase vienen por defecto. Para otro puerto: `PORT=3000 docker compose up --build`.

## Desarrollo local

```bash
cp .env.example .env
npm install
npm run dev
```

## Qué incluye

- **Inicio**: Ocho en el centro con sus tentáculos hacia las 8 categorías (pasa el cursor por una y la mira, se pone su accesorio y su tentáculo se ilumina), cinta en vivo de skills nuevas, populares en bloque destacado, categorías con subcategorías, ranking de repositorios.
- **Modo día y noche**: el contenido cambia de tema con una transición circular; el menú y el pie quedan siempre de noche. Recuerda tu elección y respeta la preferencia del sistema.
- **Explorar**: barra lateral con categorías y subcategorías, filtros por origen (oficial, verificada, comunidad) y sin scripts, vista de tarjetas o lista, scroll infinito, filtros en la URL.
- **Búsqueda inteligente**: entiende lo que quieres decir, incluso en español (“probar mi web en el navegador” encuentra skills de testing con navegador). Atajo `Ctrl + K`.
- **Ficha de cada skill**: modal en dos columnas con instalación en tres modalidades, datos del repo, avisos de seguridad, ejemplos de uso y **skills parecidas** encontradas por significado.
- **Categorías**: página por categoría con pestañas de subcategoría y conteos.
- **Conoce a Ocho**: 8 accesorios, gorro de dormir y 4 estados de ánimo; los ojos siguen el cursor.

## Stack

| Parte | Tecnología |
|---|---|
| Interfaz | React 19 + Vite (JavaScript), React Router |
| Estilos | Tailwind CSS 4, tema por variables CSS, View Transitions |
| Animaciones | Motion |
| Datos | Supabase (Postgres + pgvector, Realtime, Edge Functions, pg_cron) + TanStack Query |
| IA | Modelo de embeddings `gte-small` integrado en Supabase |
| Tipografía | Bricolage Grotesque, Geist y Geist Mono (servidas desde el sitio) |
| Servidor | Nginx en Docker |

## Backend (Supabase)

Proyecto `yklvcnoiblejvmjnqqjy`. Todo corre solo:

| Tarea | Frecuencia | Qué hace |
|---|---|---|
| Descubrir | cada 2 min | Busca repos en GitHub por temas (`agent-skills`, `claude-skills`, …) en rangos de estrellas y los pone en cola |
| Rastrear (`crawl-skills`) | cada 20 s | Lista los archivos del repo vía jsDelivr, lee cada `SKILL.md` y guarda las skills |
| Clasificar (`classify-skills`) | cada 5 s | Calcula el embedding de cada skill y la asigna a la subcategoría más parecida |
| Buscar (`search`) | a pedido | Búsqueda híbrida: texto + significado, con glosario español→inglés |

Cada tarea solo se ejecuta si hay trabajo pendiente, para no gastar ejecuciones del plan gratuito.

### Agregar repositorios o temas

```sql
-- un repo concreto
insert into public.discovery_queries (query, priority) values ('repo:usuario/repo', 1);
-- un tema nuevo de búsqueda en GitHub
insert into public.discovery_queries (query, priority) values ('topic:mi-tema stars:>=1', 5);
```

### Corregir una clasificación a mano

```sql
update public.skills
set subcategory_id = (select id from public.subcategories where slug = 'e2e'),
    category_id = (select id from public.categories where slug = 'testing'),
    category_locked = true
where slug = 'anthropics-webapp-testing';
```

### Token de GitHub (opcional)

El sistema funciona sin token. Con uno (Supabase → Edge Functions → Secrets → `GITHUB_TOKEN`, solo lectura) descubre repositorios unas tres veces más rápido.

### Traer las migraciones como archivos

```bash
npx supabase link --project-ref yklvcnoiblejvmjnqqjy
npx supabase migration fetch
```

## Skills incluidas para trabajar en este repo

`.claude/skills/` trae `frontend-design` y `webapp-testing` (Anthropic, Apache 2.0) y `supabase` (Supabase, MIT).

## Aviso

SkillVerse no está afiliado a Anthropic ni a ningún proveedor de agentes. Cada skill pertenece a su autor y conserva su licencia; el sitio muestra un resumen y enlaza al original.
