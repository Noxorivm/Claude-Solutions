# 04 · Arquitectura técnica

## Stack elegido y por qué

| Capa | Elección | Motivo |
|---|---|---|
| Framework | **Next.js 15+ (App Router, React 19, TypeScript estricto)** | Full-stack en un solo despliegue Docker; Server Components para leer BD sin API intermedia; Server Actions para mutaciones. |
| Estilos/UI | **Tailwind CSS v4 + shadcn/ui (Radix)** | Velocidad + accesibilidad de base (Radix) + control total del diseño (tokens en `06`). |
| ORM | **Drizzle ORM + drizzle-kit** | Tipado end-to-end, migraciones SQL versionadas, ya conocido por el equipo. |
| BD | **PostgreSQL 16+** | Requisito del proyecto; enums, JSONB para rúbricas/criterios, robusto autoalojado. |
| Auth | **better-auth** (email/contraseña) | Moderno, adapter oficial de Drizzle, sesiones en Postgres, campos extra en `user` (rol, XP), fácil añadir OAuth después. |
| Validación | **Zod** | Esquemas compartidos cliente/servidor; cada Server Action valida su input. |
| Datos cliente | **TanStack Query** solo donde hay interactividad real (cronómetro, admin); el resto, RSC + revalidación. |
| Markdown | `react-markdown` + `remark-gfm` + sanitizado (`rehype-sanitize`) + resaltado opcional. |
| Vídeo | Embeds **YouTube (`youtube-nocookie.com`) / Vimeo** con *facade* (carga al click) + `<video>` HTML5 para MP4 propios con pista VTT. |
| Gráficas | **Recharts** (heatmap de actividad: componente propio simple). |
| Testing | **Vitest** (unidades: XP, racha, repaso) + **Playwright** (smoke E2E). |
| Calidad | ESLint + Prettier + `tsc --noEmit` en CI (GitHub Actions). |
| Despliegue | **Docker Compose en OVH**: `app` (Next standalone) + `postgres` + **Caddy** (TLS automático). |
| Logs | `pino` en servidor; sin telemetría externa. |

### Alternativas consideradas (y por qué no, de momento)

- **Vite SPA + API Hono/Express:** más piezas que mantener (CORS, dos despliegues) sin beneficio para este caso.
- **Supabase self-hosted:** el equipo lo conoce, pero aquí no se necesita realtime ni RLS multi-tenant; Postgres "a pelo" + Drizzle es más simple y portable. Migrable después si hiciera falta.
- **Hosting de vídeo propio (HLS/Mux):** coste y complejidad innecesarios para el MVP; los embeds cubren el caso.

## Estructura del repositorio

```
Claude-Solutions/
├── CLAUDE.md                  # guía para Claude Code (plantilla en docs/07)
├── docs/                      # estos documentos (00–07)
├── docker/
│   ├── Dockerfile             # multi-stage, output standalone
│   └── docker-compose.yml     # prod: app + postgres + caddy
├── docker-compose.dev.yml     # solo postgres para desarrollo
├── drizzle/                   # migraciones generadas (commiteadas)
├── public/
├── src/
│   ├── app/
│   │   ├── (public)/          # landing, login, register
│   │   ├── (app)/app/         # dashboard, ruta, cursos, leccion, practica, tecnicas, progreso, perfil
│   │   ├── (admin)/admin/     # CMS
│   │   └── api/auth/[...all]/ # handler de better-auth
│   ├── components/            # ui/ (shadcn), course/, lesson/, practice/, charts/, admin/
│   ├── db/
│   │   ├── schema/            # un archivo por dominio: auth.ts, content.ts, progress.ts, practice.ts, gamification.ts
│   │   ├── index.ts           # cliente drizzle
│   │   └── seed/              # seed.ts + datos del currículo (curriculum.ts)
│   ├── actions/               # Server Actions por dominio (progress.ts, practice.ts, admin/*.ts…)
│   ├── lib/
│   │   ├── auth.ts / auth-client.ts
│   │   ├── guards.ts          # requireUser(), requireAdmin()
│   │   ├── xp.ts, streak.ts, spaced-repetition.ts, video.ts (parser URL→provider)
│   │   └── validators/        # esquemas Zod
│   └── styles/globals.css     # tokens de 06
├── tests/                     # vitest + e2e/
└── .github/workflows/ci.yml
```

## Patrones obligatorios

1. **Lecturas** en Server Components con consultas Drizzle directas (sin capa REST interna). Consultas complejas viven en `src/db/queries/`.
2. **Mutaciones** solo vía Server Actions: `requireUser()/requireAdmin()` → parse Zod → operación → `revalidatePath`. Nunca lógica de negocio en el cliente.
3. **Reglas de dominio puras** (`lib/xp.ts`, `lib/streak.ts`, `lib/spaced-repetition.ts`): funciones sin IO, cubiertas por Vitest. Las actions las orquestan.
4. **Transacciones** para operaciones compuestas (completar lección = progreso + XP + activity_day, todo o nada).
5. **Errores**: actions devuelven `{ ok, error? }` tipado; el cliente muestra toasts; nada de lanzar excepciones al usuario.
6. **Fechas**: almacenar en UTC (`timestamptz`); cálculos de "día" (racha, heatmap) con zona `Europe/Madrid` en `lib/streak.ts`.
7. **Subidas** (imágenes de lecciones): a volumen local `/data/uploads` servido por ruta dedicada; nombres hash; validación de MIME y tamaño (≤ 5 MB). S3/MinIO queda como evolución.

## Configuración y entornos

Variables (`.env.example` commiteado):
```
# Puerto 5433: el 5432 lo ocupa un Postgres del host en la máquina de desarrollo
DATABASE_URL=postgres://claude_solutions:claude_solutions@localhost:5433/claude_solutions
BETTER_AUTH_SECRET=change-me
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
UPLOADS_DIR=./data/uploads
```
Desarrollo: `docker compose -f docker-compose.dev.yml up -d` (Postgres) + `pnpm dev`. Scripts npm: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `db:generate`, `db:migrate`, `db:seed`, `db:studio`.

## Seguridad

- Sesiones cookie `httpOnly` + `secure` + `sameSite=lax` (better-auth); hashing de contraseñas a cargo de better-auth.
- Autorización en servidor SIEMPRE (guards en cada action y layout de `(admin)`); el cliente solo oculta UI.
- Rate limiting básico en endpoints de auth (middleware simple por IP).
- Sanitizado del markdown renderizado (rehype-sanitize) — el contenido lo crea el admin, pero defensa en profundidad.
- Cabeceras: CSP razonable (permitir frames solo de youtube-nocookie/vimeo), `X-Frame-Options`, `Referrer-Policy`.
- Backups: `pg_dump` diario vía cron en el host a `/backups` con rotación 14 días (script en `docker/`).

## Despliegue (F6)

1. `Dockerfile` multi-stage (deps → build → runner `node:22-alpine`, `output: "standalone"`).
2. `docker/docker-compose.yml`: `caddy` (80/443, volumen certificados) → `app:3000`; `postgres` con volumen; red interna; healthchecks.
3. `Caddyfile`: `claude-solutions.tudominio.com { reverse_proxy app:3000 }`.
4. Despliegue por SSH: `git pull && docker compose build && docker compose up -d` (documentar en `docs/deploy.md` durante F6). Migraciones, seed y contenido se ejecutan en el arranque del contenedor (`migrate → seed → content:apply` antes de `start`; los tres idempotentes).

## Decisiones registradas (ADR breve)

- **ADR-1:** Next.js full-stack en lugar de SPA+API → un artefacto, menos superficie.
- **ADR-2:** better-auth en lugar de NextAuth → flujo credenciales de primera clase + Drizzle adapter.
- **ADR-3:** Embeds de vídeo en lugar de hosting propio → coste/MVP; el modelo de datos guarda `provider` para migrar después.
- **ADR-4:** XP solo aditivo con log de actividad → integridad y simplicidad anti-trampas.
- **ADR-5:** Sin i18n en MVP (todo `es`), pero textos de UI centralizados en `lib/strings.ts` para facilitarla después.
