# SkillVerse

Directorio independiente de **Agent Skills** (formato `SKILL.md`) con miles de skills descubiertas automáticamente en GitHub, **clasificadas con IA en 8 categorías y 37 subcategorías**, con búsqueda inteligente y actualización en tiempo real.

Su mascota es **Nodo**, una araña saltarina morada en pixel art (diseño propio). Teje la red de categorías, hace travesuras por todo el sitio y, cuando trabajas, se viste de ayudante: un gorro por categoría y un objeto por subcategoría.

## Arrancar con Docker

```bash
cp .env.example .env   # luego pon tus valores de Supabase en .env
docker compose up --build
```

Abre http://localhost:8080. Docker lee la URL y la clave pública de Supabase desde `.env`, que no se sube al repositorio. Para otro puerto, cambia `PORT` en `.env`.

## Desplegar en Vercel

1. Importa el repositorio en Vercel. Detecta Vite solo; `vercel.json` ya trae el build y las rutas.
2. En **Settings → Environment Variables** agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` con los valores de tu `.env`.
3. Despliega. Si cambias las variables, vuelve a desplegar: Vite las incrusta al compilar.

## Desarrollo local

```bash
cp .env.example .env
npm install
npm run dev
```

## Qué incluye

- **Inicio**: telaraña con las 8 categorías. Nodo camina solo de una categoría a la siguiente cada pocos segundos y se cambia de gorro; al pasar el cursor por una, va hacia ella. Debajo: cinta en vivo de skills nuevas, populares, categorías con subcategorías y ranking de repositorios.
- **Modo día y noche**: el contenido cambia de tema con una transición circular; el menú y el pie quedan siempre de noche. Recuerda tu elección y respeta la preferencia del sistema.
- **Explorar**: barra lateral con categorías y subcategorías, filtros por origen (oficial, verificada, comunidad) y sin scripts, vista de tarjetas o lista, scroll infinito, filtros en la URL.
- **Búsqueda inteligente**: entiende lo que quieres decir, incluso en español (“probar mi web en el navegador” encuentra skills de testing con navegador). Atajo `Ctrl + K`.
- **Ficha de cada skill**: modal en dos columnas con instalación en tres modalidades, datos del repo, avisos de seguridad, ejemplos de uso y **skills parecidas** encontradas por significado.
- **Categorías**: página por categoría con pestañas de subcategoría y conteos.
- **Nodo por todo el sitio**: baja colgado de un hilo, cruza la pantalla, se asoma por los bordes y se duerme en una esquina. Celebra cuando copias un comando, se pone triste si la búsqueda no encuentra nada y se enoja si falla la conexión. Al entrar a una categoría, subcategoría o skill se queda abajo a la izquierda vestido para esa tarea. Se puede esconder desde el pie de página.
- **Conoce a Nodo**: 10 estados de ánimo, 8 gorros y 37 objetos para probárselos; los ojos siguen el cursor.

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

Todo corre solo en tu proyecto de Supabase:

| Tarea | Frecuencia | Qué hace |
|---|---|---|
| Descubrir | cada 20 min | Busca repos en GitHub por temas (`agent-skills`, `claude-skills`, …) en rangos de estrellas y los pone en cola |
| Rastrear (`crawl-skills`) | cada 2 min | Lista los archivos del repo vía jsDelivr, lee cada `SKILL.md` y guarda las skills |
| Clasificar (`classify-skills`) | cada 30 s | Calcula el embedding de cada skill y la asigna a la subcategoría más parecida |
| Cachés del catálogo | cada 10 min | Recalcula conteos, populares, recién llegadas y estado (`private.refresh_catalog()`) |
| Duplicados | cada 30 min | Marca skills repetidas entre repositorios (`private.mark_duplicates_all()`) |
| Buscar (`search`) | a pedido | Búsqueda híbrida: texto + significado, con glosario español→inglés |

Cada tarea solo se ejecuta si hay trabajo pendiente. El rastreo y el descubrimiento se detienen solos al llegar a unas 30.000 skills, para no pasar los límites de disco y CPU del plan gratuito de Supabase. Las visitas leen conteos y listados de portada desde cachés, así que no recorren la tabla de skills.

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
npx supabase link --project-ref <tu-project-ref>
npx supabase migration fetch
```

### Editar el pixel art de Nodo

Los dibujos están en `scripts/nodo-sprites.py` (cuadrícula de 40×36). Tras cambiarlos, ejecuta `python3 scripts/nodo-sprites.py` para regenerar `src/components/nodo/sprites.js`. El vestuario por categoría y subcategoría está en `src/lib/nodo.js`.

## Skills incluidas para trabajar en este repo

`.claude/skills/` trae `frontend-design` y `webapp-testing` (Anthropic, Apache 2.0) y `supabase` (Supabase, MIT).

## Aviso

SkillVerse no está afiliado a Anthropic ni a ningún proveedor de agentes. Cada skill pertenece a su autor y conserva su licencia; el sitio muestra un resumen y enlaza al original.
