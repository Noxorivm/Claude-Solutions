# 07 · Roadmap y flujo de trabajo con Claude Code

Este documento dirige el desarrollo. El Claude Project genera **un prompt por tarea** (formato de abajo); el usuario lo ejecuta en Claude Code dentro del repo y reporta el resultado. Las tareas se marcan aquí (en la copia del repo `docs/07-...md`) al completarse.

## Cómo se trabaja

1. Cada tarea ≈ una sesión de Claude Code (15–60 min). Si crece, se divide.
2. Claude Code tiene el repo: los prompts **referencian** `docs/*` y `CLAUDE.md` en vez de repetirlos.
3. Toda tarea termina con verificación (`pnpm lint && pnpm typecheck && pnpm test`), checklist actualizada y commit `tipo(scope): descripción [F#-T#]`.
4. El orden es el listado; solo se altera con motivo anotado.

## Definition of Done (toda tarea)

- [ ] Criterios de aceptación del prompt cumplidos y verificados a mano.
- [ ] `pnpm lint`, `pnpm typecheck` y `pnpm test` en verde.
- [ ] Sin `any` nuevos, sin secretos, sin TODOs silenciosos (TODO ⇒ comentario con tarea futura).
- [ ] Reglas de dominio nuevas (XP, racha, repaso, desbloqueo) con test unitario.
- [ ] UI nueva: navegable por teclado, estados vacío/carga/error, ambos temas.
- [ ] Checklist de este documento actualizada + commit.

## Roadmap de Claude Solutions

Claude Solutions **bifurca** la plataforma de Cubiletica (toda su arquitectura,
componentes, pipeline de contenido y esquema) y construye encima un producto
nuevo: formación para aprender a usar Claude. La historia de cómo se construyó
la plataforma base se conserva más abajo («Roadmap heredado de Cubiletica»).

### Fase CS · Bifurcación y producto Claude
- [x] **CS-T1 Fork + rebrand + sepia + currículo en blanco (17/06/2026):**
  copia del repo de Cubiletica rebautizada a «Claude Solutions» (textos
  visibles, wordmark, metadatos, `package.json`, `CLAUDE.md`, encabezados de
  docs; **sin** renombrar tablas/columnas del esquema). Tema oscuro «Tapete
  nocturno» intacto y por defecto; el claro «Ensayo» sustituido por **Sepia**
  (paleta cálida; pares AA recalculados y listados en docs/06). Seed con 6
  niveles renombrados (N0 «Primeros pasos» … N5 «Sistemas agénticos en
  producción») y currículo **vacío** (0 cursos/lecciones, `techniques` y
  `quizzes` vacíos, logros genéricos), admin desde env, idempotente. E2E en
  verde (smoke; full-flow en `skip` con TODO hasta que haya contenido). Stubs
  de docs 01/02; resto con el nombre actualizado. Features y esquema intactos.
- [x] **CS-T2 Diseño del currículo (docs/02) (17/06/2026):** currículo de Claude
  Solutions diseñado y escrito en docs/02 (antes un stub) — principios
  pedagógicos, **principio de VOZ** gobernante, anatomía de lección, tipos
  (`article`/`exercise`/`quiz`/`milestone` + `simulation` previsto), los 6
  niveles con foco e hito de salida, **N0–N1 a nivel de lección** (cursos
  aprobados: N0 = 0.1 Bienvenido a Claude · 0.2 Tu primera conversación útil;
  N1 = 1.1 El arte de pedir · 1.2 Trabajar con tus materiales · 1.3 Hacer tuyo a
  Claude) y **N2–N5 a nivel de módulo**, catálogo de ~40 habilidades y nota de
  derechos/actualización. Todo **anclado en doc oficial vigente** y citado
  (docs.claude.com, support.claude.com, anthropic.com, code.claude.com). Solo
  docs; sin tocar seed ni código.
- [x] **CS-T3 Seed del currículo (esqueleto en borrador) (17/06/2026):** encajada
  en `src/db/seed/curriculum.ts` la estructura de docs/02 — 6 niveles
  reconciliados (tagline + hito de salida), N0–N1 a nivel de lección (5 cursos,
  15 módulos, 50 lecciones; tipos mapeados `exercise`→`practice`), N2–N5 a nivel
  de módulo (1 curso por nivel, 17 módulos, sin lecciones) y las 41 habilidades
  en `techniques` (puente de categoría al enum heredado, sin migrar; relabel en
  CS-T5), con 31 enlaces lección↔habilidad. **Todo `draft`**, cuerpos
  `[REDACTAR]`, sin checklists ni preguntas de quiz. `db:seed` idempotente; app
  arranca (student-facing vacío, estructura en el admin); E2E verde (smoke +
  full-flow skip). Sin tocar esquema; sin lecciones `simulation` (reservado a
  CS-T6).
- [ ] **CS-T4 Redacción de lecciones N0–N1 (curso a curso):** los cuerpos con la
  **voz** de docs/02 §2, anclados y citados, vía el pipeline `content/` heredado.
  - [x] **Curso 0.1 «Bienvenido a Claude» (17/06/2026):** las 14 lecciones (M1 Qué
    es Claude · M2 Hablar con Claude · M3 Honestidad y límites), en la voz cercana,
    con honestidad sobre los límites desde la primera lección, ancladas en doc
    oficial y citadas; checklists reales en las 3 prácticas + el hito y un quiz de
    5 preguntas en el seed. En draft. Verificado sin Docker (lint/typecheck/test +
    dry-run del parser de `content:apply` en los 14 .md); `content:apply`/`db:seed`
    idempotentes y el render en el admin quedan pendientes de Docker (los cubre el
    CI al pushear).
  - [ ] Cursos 0.2, 1.1, 1.2 y 1.3 (resto de N0–N1).
- [x] **CS-T4b Cablear `content:apply` en CI y arranque (17/06/2026):** el CI
  ejecutaba `seed` pero no `content:apply`, y el arranque de producción solo
  hacía `migrate` (el `seed` estaba bundleado pero sin invocar) — fuera de
  desarrollo las lecciones se servirían con `[REDACTAR]`. Añadido: paso
  `content:apply` en `.github/workflows/ci.yml` (tras `seed`, antes del e2e);
  secuencia `migrate → seed → content:apply → server` en el CMD del
  `docker/Dockerfile` (apply-content bundleado a `docker/dist/`, `content/`
  copiado a la imagen, `SEED_ADMIN_*` ya requeridas en compose); e2e
  `lesson-content.spec.ts` que falla si el cuerpo de una lección del 0.1
  renderiza con `[REDACTAR]` (preview del admin = `MarkdownContent` del
  alumno); flujo de contenido documentado en `CLAUDE.md` + `docs/04` +
  `docs/deploy.md`. lint/typecheck/test en verde; e2e/arranque pendientes de
  Docker (los cubre el CI al pushear).
- [ ] **CS-T5 Remapeo de conceptos en la app:** adaptar el dominio y el microcopy
  heredados de magia (técnicas → habilidades, "práctica", nombres de rango de
  jugador, taglines de empty-state) al de Claude, **sin** tocar el esquema.
- [ ] **CS-T6 Simulador:** diseñar y construir el tipo de lección `simulation`
  (feature nueva específica de Claude Solutions).

> Orden orientativo: CS-T3 y CS-T4 pueblan el contenido; CS-T5 puede ir en
> paralelo; CS-T6 es la feature nueva. El detalle por tarea lo genera el Project
> con la plantilla de prompt de más abajo.

## Roadmap heredado de Cubiletica (plataforma base)

### F0 · Cimientos
- [x] **F0-T1 Scaffolding:** Next.js 15+ (App Router, TS estricto) con pnpm; Tailwind v4 + shadcn/ui init; ESLint+Prettier; Vitest configurado con un test trivial; estructura de carpetas de `docs/04`; copiar estos documentos a `/docs`; crear `CLAUDE.md` (plantilla abajo); `.env.example`; commit inicial.
- [x] **F0-T2 BD de desarrollo:** `docker-compose.dev.yml` (postgres 16, volumen, healthcheck); Drizzle instalado y configurado (`drizzle.config.ts`, cliente en `src/db/index.ts`); scripts `db:generate|migrate|seed|studio`; conexión verificada.
- [x] **F0-T3 CI:** GitHub Actions (install → lint → typecheck → test); Playwright instalado con smoke placeholder (`/` responde 200) que corre en CI con build.

### F1 · Datos y autenticación
- [x] **F1-T1a Esquema auth:** tablas de better-auth (user, session, account, verification) generadas con su CLI en `src/db/schema/auth.ts`, con los campos extra de user (`role` enum user_role, `xp`, `free_roam`); primera migración generada y aplicada.
- [x] **F1-T1b Esquema resto de dominios:** tablas/enums/índices restantes de `docs/05` en `src/db/schema/*` (un archivo por dominio: content, progress, practice, gamification); migración generada y aplicada; `db:studio` muestra el esquema completo.
- [x] **F1-T2 Auth:** better-auth con adapter Drizzle y `additionalFields` (role, xp, free_roam); handler en `app/api/auth/[...all]`; páginas `/login` y `/register`; `lib/guards.ts` (`requireUser`, `requireAdmin`); grupos de rutas `(app)` y `(admin)` protegidos; logout.
- [x] **F1-T3 Seed:** `src/db/seed/curriculum.ts` con niveles 0–5, cursos/módulos completos, lecciones detalladas de N0–N1 (contenido `[REDACTAR]`, checklists reales de `docs/02`), técnicas (`docs/02 §10`), logros base, quiz de ejemplo y admin desde env. Idempotente.
- [x] **F1-T4 Shell visual:** tokens y fuentes de `docs/06` (next/font: Bodoni Moda, Atkinson Hyperlegible, Spline Sans Mono); layout `(app)` con sidebar/bottom-bar; toggle tema persistente; página dashboard placeholder con saludo real del usuario.

### F2 · Núcleo de aprendizaje
- [x] **F2-T1 Mapa de ruta:** `/app/ruta` con niveles y naipes-curso (estados bloqueado/disponible/en curso/completado, %); lógica de desbloqueo por `is_required` + hito; respeto de `free_roam`; animación de volteo con reduced-motion.
- [x] **F2-T2 Curso:** `/app/cursos/[slug]` con acordeón módulos→lecciones, iconos por tipo, check de completadas, botón Continuar; lecciones secuenciales bloqueadas salvo modo libre.
- [x] **F2-T3 Lección (lectura):** `/app/leccion/[slug]`: markdown sanitizado (GFM), `VideoEmbed` con facade (youtube-nocookie/vimeo/file+VTT) y parser `lib/video.ts` testado; recursos; breadcrumb y prev/next.
- [x] **F2-T4 Lección (interacción):** action transaccional `completeLesson` (progreso + `xp_events` + `activity_days`, reglas por tipo de `docs/05`); `lib/xp.ts` y `lib/streak.ts` con tests; checklist persistente; notas con autosave (debounce); barra inferior fija.
- [x] **F2-T5 Dashboard v1:** Continuar donde lo dejaste, racha real, XP/nivel de jugador, minutos de práctica de la semana (cuando exista F3, placeholder mientras), estados vacíos útiles.

### F3 · Práctica y técnicas
- [x] **F3-T1 Diario de práctica:** `/app/practica` con cronómetro persistente a recargas, fin de sesión (técnica/lección, autoevaluación, notas), registro manual; action transaccional con tope de XP diario.
- [x] **F3-T2 Técnicas:** listado con filtros por categoría/dominio y ficha (`MasteryDial`, historial, lecciones relacionadas, edición de dominio con recálculo de repaso).
- [x] **F3-T3 Progreso:** `/app/progreso` con `ActivityHeatmap` (26 semanas, alternativa textual), barras por categoría, tabla de técnicas; cálculos en Europe/Madrid testados.

### F4 · Motivación
- [x] **F4-T1 Quizzes:** render, corrección con explicaciones, intentos guardados, nota mínima como gate de completado.
- [x] **F4-T2 Hitos:** `RubricForm` sobre los checklist-items, `milestone_submissions`, gate de completado, historial visible.
- [x] **F4-T3 Logros:** motor de criterios (jsonb) evaluado tras eventos clave; otorgar una vez; toast + vitrina en perfil.
- [x] **F4-T4 Repaso espaciado:** `lib/spaced-repetition.ts` (1·3·7·14·30·60; fallo reinicia) con tests; cola "Para repasar hoy" en dashboard y prácticas que la resuelven.

### F5 · Admin CMS
- [x] **F5-T1 Base admin:** layout sobrio, guard, dashboard de contenidos, tablas CRUD de cursos y módulos con validación Zod.
- [x] **F5-T2 Editor de lección:** formulario completo (markdown con preview, vídeo con autodetección, checklist, técnicas asociadas, recursos, borrador/publicado) + subida de imágenes a `/data/uploads` con validación.
- [x] **F5-T3 Resto CRUD:** reordenación accesible (drag & drop + botones), técnicas, quizzes con preguntas/opciones, gestión de usuarios (rol, desactivar, protección último admin).

### F6 · Producción
- [x] **F6-T1 Docker prod:** Dockerfile multi-stage standalone; `docker/docker-compose.yml` (app+postgres+caddy, healthchecks, migrate-on-start); `Caddyfile`; `docs/deploy.md` con runbook OVH.
- [x] **F6-T2 Operación:** script de backup `pg_dump` con rotación 14 días + restauración documentada; smoke E2E completo (login → completar lección → registrar práctica) en CI.
- [x] **F6-T3 Pulido final:** auditoría de la checklist WCAG de `docs/06` pantalla a pantalla; Lighthouse ≥ 90 perf/a11y en dashboard, ruta y lección; revisión de estados vacíos y microcopy.

## Fase C · Contenido (post-roadmap: redacción de los cursos N0–N1)

Redacción original en español de las lecciones `[REDACTAR]`, curso a
curso, con la anatomía de `docs/02 §2` y las fuentes en `content/`
aplicadas vía `pnpm content:apply` (idempotente; respeta ediciones del
admin salvo `--force`).

- [x] **C-0.1 «Bienvenido a la magia»:** las 11 lecciones (6 article, 2 video con callout de vídeo pendiente, quiz, practice, milestone) + infraestructura `content/` y `scripts/apply-content.ts`.
- [x] **C-0.2 «Magia con objetos cotidianos»:** gomas, objetos de bolsillo, presentación I.
- [x] **C-1.1a «Cartomagia fundamental I» (M1–M2):** manejo básico (mecánico, extensiones, mezclas, calentamiento), carta clave y controles (injog, pinky break y doble corte) + las 5 preguntas reales del quiz «¿Qué control usar?».
- [x] **C-1.1b «Cartomagia fundamental I» (M3–M5):** forzajes sencillos, doble volteo, primera rutina (carta ambiciosa básica) y su hito.
- [x] **C-1.2 «Numismagia I»:** sujeciones y empalmes, desapariciones, rutina de una moneda.
- [x] **C-1.3 «Cuerdas y esponjas»:** bolas de esponja y cuerda básica.
- [x] **C-1.4 «Presentación II»:** misdirection básica y gestión del público (incluye el hito de nivel).

**Fase C completa (12/06/2026):** los 6 cursos de N0–N1 redactados — 54
lecciones con contenido real en BD, cero `[REDACTAR]`. Pendiente de
producción aparte: grabación de los vídeos (docs/02 §13) y el Nivel 2.

## Revisiones post-MVP

- [x] **R1 «Academia arcana» (12/06/2026):** tema oscuro profundizado (`#120A10`, viñeteado CSS, `--accent-glow`), oro vivo `#D4AF37`, display Cinzel y catálogo de microinteracciones (naipes 3D, glow en botones/foco, indicador de nav, card-lift, subrayado animado). docs/06 revisado en el mismo commit; AA verificado y Lighthouse 97–98/100 mantenido.
- [x] **R2a «Tapete nocturno» (12/06/2026, maqueta en validación):** dirección de fantasía premium en shell + dashboard + ruta: paleta verde petróleo (`#0A1310`/`#11201B`/`#182B24`, oro intacto, 27 pares AA recalculados), `ornate-frame` (sutil/protagonista, border-image SVG propio), `hex-medallion`, titulares dorados metálicos + eyebrows versalitas, line-art propio al 3–5 %, atmósfera (niebla 66–84s + 10 motas, motion-safe, apagada en reduced-motion y en claro), fade-up de secciones y fade de ruta vía template. docs/06 revisado como R2a con antipatrón reformulado; Lighthouse 97/100 + A11y 100 en dashboard y ruta; capturas en `.local/design-r2a/`. R2b migró el resto (curso, lección, práctica, técnicas, progreso, perfil, públicas); R2-fix3 pasó el marco a CSS puro (sin border-image). **Dirección R2 completa.**

## Fase Expansión · Profundización del contenido (post-MVP, comercialización)

Ampliar el catálogo nivel a nivel. Las lecciones nuevas entran primero
como **estructura en `draft`** (cuerpo `[REDACTAR]`, invisibles para el
alumno, docs/03 H2); los cuerpos se redactan después con el pipeline
`content/` (patrón Fase C). El seed permite `status` por lección y
reordena sin colisión aparcando los `order` (negándolos) antes de
reasignarlos.

- [x] **EX-N0-T1 «Estructura del Nivel 0» (15/06/2026):** 21 lecciones
  nuevas en borrador + el módulo «Magia de sobremesa y bar» (0.2, antes
  de Presentación I). 0.1: 2 conceptuales (M1), 4 de método/presentación
  (M2), 4 efectos automáticos de vídeo + 1 bisagra (M3). 0.2: 2 de gomas
  (M1), 3 de bolsillo (M2), 3 de sobremesa (módulo nuevo), 2 de
  presentación (M4). Checklists reales en los 9 vídeos; milestones y
  quiz intactos como últimos; experiencia publicada sin cambios. Seed
  idempotente (2ª pasada idéntica) y docs/02 §4 sincronizado.
- [x] **EX-N0-T2 «Artículos fundacionales de 0.1 (M1+M2)» (15/06/2026):**
  redactados los 6 artículos nuevos de método y teoría — «Anatomía del
  asombro» y «Trucos, efectos, rutinas y actos» (M1); «Cómo ensayar de
  verdad», «Grabarte es tu mejor maestro», «Construye tu personaje
  mágico» y «Domar el miedo escénico» (M2). Arco del clúster (entender
  → practicar → interpretar) con siembras: memoria reconstructiva →
  forzaje cruzado de 1.1, solución falsa (Tamariz) → teoría de N2/N3,
  el dial de dominio y el repaso espaciado, los cinco hitos y el
  repertorio/marca de N4–N5. Sin checklist ni callout de vídeo;
  `content:apply` idempotente; **siguen en draft** (pendientes de
  revisión del dueño).
- [x] **EX-N0-T3 «Efectos autotrabajados de 0.1 M3» (15/06/2026):** los
  4 efectos de vídeo («Las 21 cartas», «El reloj imposible», «Hazlo como
  yo», «Predicción con dados») + el artículo bisagra «Que no parezca
  matemática». **Cada mecanismo verificado caso por caso por
  simulación** antes de afirmarlo: 21 cartas → 11ª posición fija para
  las 21 cartas; reloj → la carta cae en la hora pensada para las 12
  horas (reparto desde las 12 hacia atrás); do-as-i-do → la clave queda
  sobre la selección tras cualquier corte (200 combinaciones); dados →
  arriba+abajo de 3 dados = 21 en las 216 tiradas (y pila = 7N − cima).
  Espiral: la carta clave de «Las hermanas gemelas» reusada en reloj y
  do-as-i-do; las 21 cartas ligadas a «Que no parezca matemática»;
  cruces al forzaje 10-20 (1.1) y a «Anatomía del asombro». Los 4 honran
  su checklist y llevan callout de vídeo; el artículo, ninguno.
  `content:apply` idempotente; **siguen en draft**.
- [x] **EX-N0-T4 «Efectos de objetos cotidianos de 0.2 (M1+M2)» (15/06/2026):**
  los 5 efectos de vídeo nuevos — «La goma rota y recompuesta» y «Gomas
  enlazadas» (M1); «Servilleta rota y recompuesta», «Predicción con el
  móvil» y «Apuestas imposibles» (M2). Dificultad 0.2 (impromptu, sin
  técnica de N1). **Cálculo verificado para todas las entradas:** la
  fuerza del móvil `(x·2 + 2N)/2 − x = N` (constante en 100k entradas,
  sin casos límite); el juego del 21 → victoria forzada del primero
  (serie 1-5-9-13-17); número menos su inverso → múltiplo de 9 (los 900
  de tres cifras); par/impar → la paridad delata la mano. Espiral: la
  goma sobre el salto imposible y las esposas locas; la servilleta sobre
  el lapping de 0.2 M2; el móvil ligado a «Que no parezca matemática».
  Los 5 honran su checklist y llevan callout de vídeo. `content:apply`
  idempotente; **siguen en draft**. Quedan por redactar las 5 lecciones
  de borrador de presentación y el módulo de sobremesa de 0.2.
- [x] **EX-N0-T5 «Módulo de sobremesa y Presentación I de 0.2» (15/06/2026):**
  los 5 artículos restantes — «El momento de la sobremesa», «Tu set para
  la mesa» y «Cerrar y dejar con ganas de más» (módulo nuevo de
  sobremesa); «Aperturas y cierres» y «Gestionar el "¿cómo lo has
  hecho?"» (Presentación I). Arco «el intérprete en sociedad». «Tu set»
  integra efectos concretos del repertorio N0 (salto, clips/moneda,
  predicción) y prepara el hito; «Cerrar» (retirada social) y «Aperturas
  y cierres» (estructura dramática, primacía/recencia) deslindados. Sin
  checklist ni callout. Cruces: miedo escénico + hito de confianza,
  «Estructura de un efecto», «El código del mago», encadenar de 1.1,
  Presentación II (1.4). `content:apply` idempotente; **siguen en draft**.

**Redacción del Nivel 0 ampliado COMPLETA (15/06/2026):** las 21
lecciones nuevas (0.1 M1–M3 y 0.2 M1–M4) tienen cuerpo redactado, todas
en `draft` y pendientes de revisión del dueño antes de publicar. Cero
`[REDACTAR]` en draft de N0. Pendiente: grabación de vídeos de los 9
efectos nuevos y publicación tras revisión.

- [x] **MEDIA-T1 «Auditoría de media y verificación de tuberías» (15/06/2026):**
  inventario de media por lección en N0–N1 en `docs/media-readiness.md`
  (tabla-resumen + checklist de producción del autor). Estado: **39
  lecciones de vídeo, todas con callout, 0 con `video_url`; 0 imágenes
  referenciadas**. Verificadas de extremo a extremo y de forma
  reversible las dos tuberías — embed de vídeo (parser youtube/vimeo/
  file, facade perezosa con youtube-nocookie, autodetección del editor)
  y render de imagen (subida admin → `/uploads` → `MarkdownContent`) —
  con **veredicto: infraestructura OK**. Nada de prueba persistió.
- [x] **VIDEO-T1 «Candidatos de vídeo del Nivel 0 para validar» (15/06/2026):**
  `docs/video-candidates-n0.md` con 1–2 tutoriales candidatos por cada
  una de las **16 lecciones de vídeo de N0**, con método de la lección
  (lo que debe coincidir), URL/idioma + por qué encaja, y campo
  «Elegido». **16/16 con candidato** (13 con dos, 3 con uno). URLs
  reales de búsqueda, valoradas por metadatos (no por visionado).
  **No se incrustó ni se asignó `video_url` a nada**: pendiente del
  visto bueno del autor; las no elegidas se cubrirán con vídeo propio o
  diagrama. N1 vendrá después si el formato funciona.

## Plantilla de prompt para Claude Code

```markdown
# Tarea F#-T#: <título>

## Contexto
Proyecto Claude Solutions (plataforma de formación para aprender a usar Claude). Lee antes de empezar: `CLAUDE.md`
y las secciones relevantes: <docs/0X §...>. Estado actual: <qué existe ya>.

## Objetivo
<Resultado observable en una frase.>

## Pasos
1. <paso concreto>
2. ...

## Restricciones
- No toques <áreas fuera de alcance>.
- No añadas dependencias fuera de: <lista o "ninguna nueva">.
- Sigue los patrones de docs/04 (actions con guard+Zod, reglas puras en lib/, transacciones).

## Criterios de aceptación
- [ ] <verificable 1>
- [ ] <verificable 2>

## Verificación
pnpm lint && pnpm typecheck && pnpm test
<comandos manuales: p. ej. pnpm dev y comprobar /app/ruta>

## Al terminar
Marca la tarea en docs/07-roadmap-y-flujo-claude-code.md, resume qué hiciste y
qué decisiones tomaste, y commitea: `tipo(scope): descripción [F#-T#]`.
```

## Ejemplo resuelto — F0-T1 (el primer prompt que entregará el Project)

```markdown
# Tarea F0-T1: Scaffolding del proyecto

## Contexto
Repo vacío salvo una carpeta `docs/` que voy a darte (si no existe, créala con los
archivos que te indique al final). Proyecto: Claude Solutions, plataforma de formación para aprender a usar Claude.
Stack y estructura objetivo: docs/04-arquitectura.md.

## Objetivo
Proyecto Next.js listo para desarrollar: arranca, lintea, testea y tiene la
estructura de carpetas y el CLAUDE.md definitivos.

## Pasos
1. Inicializa Next.js 15+ con pnpm: App Router, TypeScript estricto, Tailwind v4,
   ESLint. Sin src alias raros: usa `@/*` → `src/*`.
2. Inicializa shadcn/ui (estilo base, CSS variables) y añade button, input, dialog,
   toast (sonner), tabs, badge, progress.
3. Configura Prettier (con plugin de tailwind) y scripts: dev, build, start, lint,
   typecheck (`tsc --noEmit`), test (vitest), format.
4. Configura Vitest con un test trivial en `tests/sanity.test.ts`.
5. Crea la estructura de carpetas de docs/04 §Estructura (carpetas vacías con
   `.gitkeep` donde haga falta) y `.env.example` con las variables de docs/04.
6. Crea `CLAUDE.md` copiando la plantilla de docs/07 §Plantilla de CLAUDE.md y
   ajustando lo que ya sea real.
7. `.gitignore` correcto (node_modules, .next, .env*, data/).

## Restricciones
- No instales Drizzle, better-auth ni nada de BD (eso es F0-T2/F1).
- No crees páginas más allá de una home placeholder.

## Criterios de aceptación
- [ ] `pnpm dev` levanta la home sin errores ni warnings de configuración.
- [ ] `pnpm lint && pnpm typecheck && pnpm test` en verde.
- [ ] Estructura de carpetas coincide con docs/04.
- [ ] `CLAUDE.md` presente y coherente con el repo real.

## Verificación
pnpm lint && pnpm typecheck && pnpm test && pnpm build

## Al terminar
Marca F0-T1 en docs/07-roadmap-y-flujo-claude-code.md, resume decisiones
(versiones instaladas) y commitea: `chore(setup): scaffolding Next.js [F0-T1]`.
```

## Plantilla de `CLAUDE.md` (raíz del repo)

```markdown
# Claude Solutions — Guía para Claude Code

Plataforma de formación para aprender a usar Claude. La documentación completa vive en /docs:
visión (01), currículo (02), funcional (03), arquitectura (04), modelo de
datos (05), UI/UX (06), roadmap (07). **Ante cualquier duda de alcance,
esquema o patrón: leer el doc correspondiente antes de improvisar.**

## Comandos
- pnpm dev · pnpm build · pnpm start
- pnpm lint · pnpm typecheck · pnpm test · pnpm test:e2e
- pnpm db:generate · pnpm db:migrate · pnpm db:seed · pnpm db:studio
- BD dev: docker compose -f docker-compose.dev.yml up -d

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
Las tareas vienen del roadmap docs/07. Al terminar una: verificar, marcar
la checklist en docs/07 y commitear. No empezar tareas no solicitadas.
```
