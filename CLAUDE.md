# Claude Solutions — Guía para Claude Code

Plataforma de formación para aprender a usar Claude (de principiante a
experto). La documentación completa vive en /docs:
visión (01), currículo (02), funcional (03), arquitectura (04), modelo de
datos (05), UI/UX (06), roadmap (07). **Ante cualquier duda de alcance,
esquema o patrón: leer el doc correspondiente antes de improvisar.**

Stack actual: Next.js 16 (App Router, Turbopack), React 19, TypeScript
estricto, Tailwind CSS v4, shadcn/ui (estilo radix-nova, CSS variables),
Vitest. Ojo: Next 16 tiene breaking changes; ante dudas de API, consultar
AGENTS.md y las guías en node_modules/next/dist/docs/.

## Comandos

- pnpm dev · pnpm build · pnpm start
- pnpm lint · pnpm typecheck · pnpm test · pnpm format
- pnpm test:e2e (Playwright; requiere pnpm build previo)
- pnpm db:generate · db:migrate · db:seed · db:studio · db:check
- BD dev: docker compose -f docker-compose.dev.yml up -d (Postgres 16 en
  localhost:5433; el 5432 lo ocupa un Postgres del host de esta máquina).

## Convenciones

- TypeScript estricto; prohibido `any` y `@ts-ignore` sin justificación.
- Código, identificadores y commits en inglés; textos de UI en español
  (centralizados en src/lib/strings.ts).
- Lecturas: Server Components + Drizzle. Mutaciones: Server Actions con
  requireUser()/requireAdmin() + Zod + transacción si toca varias tablas.
- Reglas de dominio puras en src/lib (xp, streak, spaced-repetition) con
  tests en Vitest. Fechas en UTC; "día" = Europe/Madrid.
- UI: tokens de docs/06; componentes shadcn en src/components/ui; teclado,
  estados vacío/carga/error y ambos temas en toda pantalla nueva.
- Commits: tipo(scope): descripción [F#-T#].

## Flujo de tareas

Las tareas vienen del roadmap docs/07. Al terminar una: verificar (pnpm
lint && pnpm typecheck && pnpm test), marcar la checklist en docs/07 y
commitear. No empezar tareas no solicitadas.
