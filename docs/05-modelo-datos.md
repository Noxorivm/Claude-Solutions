# 05 · Modelo de datos (PostgreSQL + Drizzle)

Esquema canónico. Implementar con Drizzle (`src/db/schema/*`, un archivo por dominio) generando estas tablas. Notación abreviada: `PK`, `FK→`, `!` = NOT NULL, `=` = default. Todas las tablas con `id` usan `uuid PK = gen_random_uuid()` salvo indicación; timestamps `timestamptz`.

## Enums

```sql
content_status      : 'draft' | 'published' | 'archived'
lesson_type         : 'article' | 'video' | 'practice' | 'quiz' | 'milestone'
video_provider      : 'youtube' | 'vimeo' | 'file'
technique_category  : 'cards' | 'coins' | 'mentalism' | 'classics' | 'stage' | 'theory'
progress_status     : 'started' | 'completed'
resource_kind       : 'pdf' | 'image' | 'link' | 'file'
user_role           : 'student' | 'admin'
xp_reason           : 'lesson' | 'quiz' | 'milestone' | 'practice' | 'achievement' | 'adjust'
```

## Autenticación (gestionada por better-auth)

better-auth genera `user`, `session`, `account`, `verification` mediante su CLI/adapter de Drizzle. **No modificar a mano**; ampliar `user` vía `additionalFields`:

```
user (better-auth)
  + role        user_role ! = 'student'
  + xp          integer   ! = 0          -- denormalizado; fuente: xp_events
  + free_roam   boolean   ! = false      -- modo libre (sin bloqueos)
```

## Contenido

```sql
levels
  id            smallint PK              -- 0..5, coincide con el nº de nivel
  slug          text ! unique            -- 'iniciado', 'aprendiz', ...
  name          text !
  tagline       text !
  description_md text

courses
  id            uuid PK
  level_id      smallint ! FK→levels
  slug          text ! unique
  title         text !
  summary       text !                   -- 1-2 frases para la tarjeta
  description_md text
  cover_url     text
  order_in_level integer !
  est_hours     numeric(4,1)
  is_required   boolean ! = true         -- cuenta para desbloquear el nivel siguiente
  status        content_status ! = 'draft'
  created_at / updated_at
  UNIQUE (level_id, order_in_level)

modules
  id uuid PK · course_id ! FK→courses · title ! · "order" integer !
  UNIQUE (course_id, "order")

lessons
  id            uuid PK
  module_id     uuid ! FK→modules
  slug          text ! unique
  title         text !
  type          lesson_type !
  content_md    text                     -- cuerpo principal (anatomía de docs/02)
  video_url     text
  video_provider video_provider          -- derivado de la URL al guardar (lib/video.ts)
  duration_min  integer                  -- estimación de la lección
  "order"       integer !
  xp_override   integer                  -- si null, XP por tipo (lib/xp.ts)
  status        content_status ! = 'draft'
  created_at / updated_at
  UNIQUE (module_id, "order")

lesson_checklist_items                    -- checklist de práctica; en 'milestone' actúa como rúbrica
  id uuid PK · lesson_id ! FK→lessons · text ! · "order" integer !

lesson_resources
  id uuid PK · lesson_id ! FK→lessons · kind resource_kind ! · title ! · url ! · "order" integer !

techniques
  id uuid PK · slug ! unique · name ! · category technique_category !
  level_number smallint ! FK→levels · description_md text

lesson_techniques
  lesson_id FK→lessons · technique_id FK→techniques · PK (lesson_id, technique_id)
```

## Progreso del alumno

```sql
lesson_progress
  user_id FK→user · lesson_id FK→lessons · PK (user_id, lesson_id)
  status        progress_status ! = 'started'
  completed_at  timestamptz
  -- progreso de curso/nivel = CALCULADO sobre lecciones published (no hay tabla enrollments)

checklist_progress
  user_id FK→user · item_id FK→lesson_checklist_items · checked_at ! · PK (user_id, item_id)

notes
  user_id FK→user · lesson_id FK→lessons · PK (user_id, lesson_id)
  content_md text ! · updated_at !

milestone_submissions
  id uuid PK · user_id ! · lesson_id ! FK→lessons(type=milestone)
  ratings     jsonb !                    -- { item_id: 1..5 } sobre los checklist_items de la lección
  reflection  text
  created_at  !
```

## Práctica y dominio

```sql
practice_sessions
  id uuid PK · user_id !
  technique_id  uuid FK→techniques       -- una de las dos referencias, al menos
  lesson_id     uuid FK→lessons
  duration_sec  integer ! CHECK (duration_sec >= 60)
  self_rating   smallint CHECK (1..5)
  notes         text
  performed_at  timestamptz !
  CHECK (technique_id IS NOT NULL OR lesson_id IS NOT NULL)

user_techniques                           -- estado de dominio + repaso espaciado
  user_id · technique_id · PK (user_id, technique_id)
  mastery           smallint ! = 0 CHECK (0..5)
  last_practiced_at timestamptz
  next_review_at    timestamptz
  interval_days     integer ! = 1        -- progresión 1,3,7,14,30,60 (lib/spaced-repetition.ts)
```

## Gamificación y actividad

```sql
xp_events                                 -- log inmutable; user.xp = SUM(amount)
  id uuid PK · user_id ! · amount integer ! · reason xp_reason !
  lesson_id uuid FK→lessons · created_at !

activity_days                             -- agregado diario (zona Europe/Madrid) para racha y heatmap
  user_id · day date · PK (user_id, day)
  lessons_completed integer ! = 0
  practice_sec      integer ! = 0
  xp                integer ! = 0

achievements
  id uuid PK · slug ! unique · name ! · description ! · icon text
  criteria jsonb !                        -- p.ej. {"type":"streak","days":7}

user_achievements
  user_id · achievement_id · earned_at ! · PK (user_id, achievement_id)
```

## Varios

```sql
uploads                                   -- imágenes subidas desde el admin
  id uuid PK · path ! unique · mime ! · size_bytes ! · created_by FK→user · created_at !

quizzes
  id uuid PK · lesson_id ! unique FK→lessons(type=quiz) · pass_pct integer ! = 80

quiz_questions
  id uuid PK · quiz_id ! FK→quizzes · "order" ! · prompt ! · explanation text
  kind text ! = 'single'                  -- 'single' | 'truefalse'

quiz_options
  id uuid PK · question_id ! FK→quiz_questions · text ! · is_correct boolean ! · "order" !

quiz_attempts
  id uuid PK · user_id ! · quiz_id ! · score_pct integer ! · passed boolean !
  answers jsonb ! · created_at !
```

## Índices (además de PKs y uniques)

```sql
lessons (module_id, "order") · courses (level_id, order_in_level)
lesson_progress (user_id, status) · practice_sessions (user_id, performed_at DESC)
user_techniques (user_id, next_review_at) · xp_events (user_id, created_at)
quiz_attempts (user_id, quiz_id) · uploads (created_by)
-- FKs con ON DELETE: contenido en cascada hacia abajo (course→module→lesson→items),
-- progreso/práctica RESTRICT al borrar contenido publicado (usar status='archived' en su lugar).
```

## Reglas de integridad implementadas en código (no triggers)

1. **Completar lección** (transacción): upsert `lesson_progress=completed` + `xp_events` + upsert `activity_days`. Lección `practice` exige checklist completa y ≥ 1 `practice_session` vinculada; `quiz` exige intento aprobado; `milestone` exige `milestone_submission`.
2. **Registrar práctica** (transacción): insert sesión + upsert `activity_days` + XP (tope 60/día por práctica) + recalcular `user_techniques` (mastery sugerido, `next_review_at`).
3. **Desmarcar lección**: borra `completed_at`/status pero NO genera XP negativo (queda el log).

## Estrategia de seed (`pnpm db:seed`)

1. Idempotente (upsert por `slug`); ejecutable en cualquier entorno.
2. Crea: 6 `levels` · catálogo de `techniques` (tabla de `docs/02 §10`) · estructura completa de cursos/módulos de los 6 niveles · lecciones detalladas de niveles 0–1 con `content_md` placeholder `[REDACTAR]`, checklists reales y vínculos lesson↔technique · 1 quiz de ejemplo (curso 0.1) · logros base · usuario admin inicial (email/contraseña desde env `SEED_ADMIN_EMAIL/PASSWORD`) con su better-auth account.
3. Los datos del currículo viven tipados en `src/db/seed/curriculum.ts` para que editar contenido inicial sea editar un archivo TS legible.
