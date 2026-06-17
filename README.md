# Claude Solutions

Plataforma de formación para aprender a usar Claude, de principiante a
experto. Reutiliza una plataforma de aprendizaje ya probada (Next.js 16,
PostgreSQL, Drizzle, better-auth): ruta por niveles, progreso, práctica,
quizzes, XP, logros y un panel de administración para curar el contenido sin
tocar código.

> Estado: bifurcación inicial (CS-T1). La plataforma está rebautizada, con el
> tema claro **sepia** y el currículo **en blanco** (6 niveles con nombre, sin
> cursos todavía). El temario y el simulador llegan en tareas posteriores.

## Puesta en marcha (desarrollo)

```bash
pnpm install
cp .env.example .env            # ajusta los valores locales
docker compose -f docker-compose.dev.yml up -d   # Postgres 16 en localhost:5433
pnpm db:migrate
pnpm db:seed                    # 6 niveles, 0 cursos; crea el admin desde .env
pnpm dev                        # http://localhost:3000
```

## Comandos

- `pnpm dev` · `pnpm build` · `pnpm start`
- `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm format`
- `pnpm test:e2e` (Playwright; requiere `pnpm build` previo)
- `pnpm db:generate` · `db:migrate` · `db:seed` · `db:studio` · `db:check`

La documentación vive en [`/docs`](docs): visión (01), currículo (02),
funcional (03), arquitectura (04), modelo de datos (05), UI/UX (06) y
roadmap (07). Convenciones y flujo de trabajo: [`CLAUDE.md`](CLAUDE.md).
