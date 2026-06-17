# 06 · Diseño UI/UX

> **Revisión R2 — «Tapete nocturno» (12/06/2026, COMPLETA).**
> Dirección de fantasía premium sobre la base R1: paleta verde petróleo
> nocturna, marcos ornamentales dorados (`ornate-frame` con silueta
> achaflanada + veladura), medallones hexagonales, titulares dorados
> metálicos, eyebrows en versalitas, atmósfera ambiental (niebla +
> motas) y line-art propio como textura. **Aplicada a TODA la app de
> alumno**: shell, dashboard y ruta (R2a/R2a-fix/R2a-fix2), curso y
> lección (R2b-1), y práctica, técnicas, progreso, perfil y públicas
> (R2b-2). El admin queda fuera por decisión propia (layout sobrio sin
> tapete). Regla de oro de legibilidad: columna de lectura, cronómetro
> y gráficas sobre fieltro casi sólido (`reading-surface`), sin
> atmósfera ni textura bajo el contenido de uso intensivo. AA y
> Lighthouse ≥90/100 son vara innegociable (docs/audit-f6t3.md).
> Lenguaje visual inspirado en fantasía premium; CERO assets/arte/
> textos de IPs ajenas.
>
> *Historial: R1 «Academia arcana» (12/06/2026) introdujo Cinzel, el
> viñeteado y el catálogo de microinteracciones; sus piezas siguen
> vigentes salvo lo que esta revisión sustituye (paleta burdeos).
> R2a maquetó shell+dashboard+ruta; R2b-1 migró curso+lección; R2b-2
> cierra el resto y declara la dirección completa.*

## Dirección de diseño: "El Tapete"

Claude Solutions no es un LMS genérico: el tema oscuro conserva la dirección «El Tapete» heredada de Cubiletica. La dirección visual sale de los materiales reales del oficio: el **telón burdeos** del teatro, el **fieltro del tapete** de magia de cerca, el **latón** de las monedas antiguas y el **dorso azul de los naipes Fournier**. Elegante y nocturna, pero cálida; nunca "neón sobre negro" ni plantilla corporativa.

**Elemento firma:** el mapa de ruta presenta cada curso como un **naipe sobre el tapete**. Curso bloqueado = carta boca abajo (patrón de dorso sutil); desbloqueado = carta boca arriba con su título; al completar una lección/curso, la carta **se voltea** con una animación breve (desactivada con `prefers-reduced-motion`). Es la única floritura grande de la interfaz: todo lo demás se mantiene sobrio y disciplinado.

## Tokens (en `src/styles/globals.css` como CSS variables; Tailwind v4 los consume)

### Color — tema oscuro "Función" (por defecto; R2a «Tapete nocturno»)

| Token | Hex | Uso |
|---|---|---|
| `--bg` Telón nocturno | `#0A1310` | Fondo general (verde petróleo casi negro) + viñeteado radial CSS |
| `--surface` Fieltro verde | `#11201B` | Tarjetas, paneles |
| `--surface-2` | `#182B24` | Hover, elevación |
| `--ink` Marfil | `#F2E9DA` | Texto principal (15.7:1 sobre Telón) |
| `--ink-muted` | `#C9B8A8` | Texto secundario (9.8:1 sobre Telón) |
| `--accent` Oro vivo | `#D4AF37` | Primario: CTA, progreso, foco, indicadores (9.0:1 sobre Telón) |
| `--accent-glow` | oro al 35 % alpha | Halos de hover/foco (box-shadows; nunca texto) |
| `--success` Tapete | `#2E6B4F` | Fondos de éxito/completado (texto Marfil encima, 5.2:1) |
| `--success-ink` | `#5FB48C` | Texto/íconos de éxito sobre fondo oscuro |
| `--info` Dorso | `#7D96D8` | Enlaces, info |
| `--danger` Corazones | `#D4564B` | Bordes/íconos de error (UI ≥3:1) |
| `--danger-ink` | `#E0786E` | Texto de error pequeño (≥4.5:1 en las tres superficies) |
| `--border` | `#2A4038` | Bordes 1px (separación con superficie, no solo sombra) |

El viñeteado del fondo es CSS puro (dos `radial-gradient`: brillo dorado
≤5 % arriba + oscurecimiento de esquinas, reforzado en R2a con tinte
verde-noche), solo en tema oscuro, y solo puede OSCURECER: nunca reduce
el contraste del texto.

### Ornamentos y atmósfera (R2a, en validación)

Sistema reutilizable, todo CSS/SVG propio (cero assets de terceros):

- **`ornate-frame-sutil` / `ornate-frame-strong`:** marco de doble
  línea dorada con esquinas achaflanadas. Sutil: naipes de la ruta,
  placas de cabecera, tarjetas de práctica/técnicas/progreso/perfil y
  formularios de auth. Protagonista (más opaco, con halo): la tarjeta
  «Continuar» del dashboard y la cabecera de la ficha de técnica.
  **Construcción en CSS PURO (R2-fix3, sin `border-image`):** marco y
  veladura derivan del MISMO octógono — `--frame-clip` (polígono de 8
  puntos con `--frame-chamfer`: 6px sutil, 8.4px strong) se declara una
  vez y se aplica a CADA capa, por lo que la costura es
  estructuralmente imposible. La **doble línea** = el `border` del
  elemento (filo exterior) + el `border` de `::before` (filo interior,
  encogido por `inset: --frame-gap`), ambos recortados por el mismo
  `--frame-clip`; la separación oscura entre filos es la **veladura**
  entrevista. El borde recortado traza el chaflán por construcción (el
  inglete a 45° del borde coincide con el corte del clip). El filo
  deriva de `--primary` (oro en oscuro, latón `#7A5E0E` en claro), así
  que el tema no necesita variante SVG aparte: en claro sólo cambia la
  superficie a sólida (`--card`, sin atmósfera). `::before` lleva
  `pointer-events:none` (no intercepta clics) y el contenido vive en el
  padding (≥ chaflán), nunca bajo el filo. **Muescas de rombo OMITIDAS**
  (autorizado por el dueño): la silueta achaflanada + doble línea son
  lo prioritario y blindan la unión. Veladura estándar: fieltro al 80 %
  (`color-mix(in srgb, var(--card) 80%, transparent)`) que deja
  entrever niebla y motas, con `felt-texture` encima; la variante
  `reading-surface` la lleva a 95 % (lectura/cronómetro/gráficas). AA
  del texto sobre veladura sin cambios (Marfil 14.4, ink-muted 9.0, oro
  8.2). El halo del protagonista vive en un wrapper EXTERIOR sin clip ni
  fondo (`.ornate-glow`, drop-shadow): así sigue el octógono y no pinta
  rectángulo (lección de R2a-fix2). Se eliminó el SVG de `border-image`
  (una request/inline menos).
- **`hex-medallion`:** contenedor hexagonal con borde dorado degradado
  (clip-path + pseudo-elemento) para iconos: racha y nivel de jugador.
- **`heading-gilded`:** titular dorado metálico — gradiente vertical
  `#F5E3A3→#D4AF37→#A98826` con `background-clip: text` y sombra
  sutil. Solo H1 y nombres de nivel. El stop más oscuro mantiene
  ≥4.5:1 sobre Telón y Fieltro; en claro cae a texto plano `--primary`
  (regla del dorado). Fallback sin `background-clip: text`: oro plano.
- **`heading-eyebrow`:** subtítulo de sección en versalitas doradas con
  tracking ancho (0.18em, 13px bold).
- **`felt-texture`:** line-art propio como textura de superficies
  principales (astros, naipe esquemático, lunas; data-uri SVG, trazo
  dorado al 3–5 % de opacidad, tile 240px). Solo en oscuro: en claro
  `--texture-arcana` vale `none` (R2a-fix) — apaga textura y el
  interior del medallón de una vez.
- **`reading-surface` (R2b-1):** superficie de lectura — fieltro casi
  sólido (95 % de `--card`) y SIN textura, para que el texto corrido de
  las lecciones no compita con la atmósfera. Es la regla de oro de la
  lección: dirección en el perímetro, legibilidad en el centro.
- **`EmptyState` (R2b-1):** estado vacío armonizado — medallón
  hexagonal con glyph line-art propio (naipe + chispa) + eyebrow +
  mensaje, sobre marco sutil y veladura. `role="status"` opcional.
- **Toast de éxito (R2b-1):** el check del toast de éxito (lección
  completada / +XP) en oro `--primary`, en paralelo al de error en
  `--danger-ink`; entrada y `aria-live` de sonner intactos.
- **Atmósfera del shell:** 2 capas de niebla (radiales enormes en
  pseudo-elementos, deriva en loop 66–84s alternate) + 10 motas doradas
  flotantes (3–5px, opacity ≤.35, detrás del contenido en `z-index:
  -1`). Presupuesto: solo fondo, solo `transform`/`opacity`
  (compositor), ≤1 % CPU, `motion-safe`; con `prefers-reduced-motion`
  cero animación y motas `display: none`; en claro la atmósfera entera
  se apaga (`display: none`).

### Color — tema claro "Sepia" (CS-T1; sustituye a «Ensayo»)

**El oscuro «Función» / «Tapete nocturno» sigue siendo el tema por
defecto** (`defaultTheme="dark"`): el claro es el tema secundario del
toggle. En CS-T1 el claro «Ensayo» (papel) se **sustituye por Sepia**:
paleta cálida de fondos tostados, tinta marrón y acento latón, SIN
atmósfera, textura ni dorados vivos (igual que «Ensayo»). Regla heredada:
**el dorado vivo (`#D4AF37`/`#C9A227`) nunca como texto/foco sobre fondo
claro** (falla AA); el acento es Latón oscuro `#7A540F`.

Tokens (en `.light`, `src/styles/globals.css`):

| Token | Hex | Uso |
|---|---|---|
| Tostado | `#EDE0CC` | `--background` (fondo general) |
| Pergamino | `#F8F0E2` | `--card` / `--popover` / `--sidebar` |
| Tostado-2 | `#E4D5BC` | `--secondary` / `--muted` / `--accent` (hover, elevación) |
| Tinta marrón | `#3B2C1A` | `--foreground` (texto principal) |
| Marrón medio | `#5F4A2E` | `--muted-foreground` (texto secundario) |
| Latón | `#7A540F` | `--primary` / `--ring` (acento, CTA, foco) |
| Crema | `#FBF6EC` | `--primary-foreground` (texto sobre Latón) |
| Ladrillo | `#A93226` | `--destructive` / `--danger-ink` |
| Verde | `#1F5C42` | `--success` / `--success-ink` |
| Azul tinta | `#33508F` | `--info` (enlaces) |
| Borde sepia | `#C7B392` | `--border` / `--input` (sutil) |

**Pares AA recalculados** (contraste WCAG; texto normal ≥4.5, UI ≥3).
Superficies: Tostado · Pergamino · Tostado-2.

| Texto \ Superficie | Tostado | Pergamino | Tostado-2 |
|---|---|---|---|
| Tinta marrón (`--foreground`) | 10.34 | 11.88 | 9.32 |
| Marrón medio (`--muted-foreground`) | 6.44 | 7.40 | 5.80 |
| Latón (`--primary`) | 5.20 | 5.98 | 4.69 |
| Ladrillo (`--danger-ink`) | 5.09 | 5.85 | 4.59 |
| Verde (`--success-ink`) | 6.05 | 6.95 | 5.45 |
| Azul tinta (`--info`) | 6.01 | 6.91 | 5.42 |

Otros pares: `--primary-foreground` Crema sobre Latón = **6.28** (texto de
botón); anillo de foco Latón sobre Tostado = **5.20** (≥3); icono de error
Ladrillo sobre Pergamino = **5.85**. El **borde** sepia es decorativo
(1.6–1.8 sobre las superficies, como en «Ensayo»): el estado esencial lo
lleva el anillo de foco y la sombra, no el borde. `--accent-glow` claro:
Latón al 20 % alpha. En claro `--texture-arcana: none` (sin atmósfera ni
line-art); el `heading-gilded` cae a Latón plano (regla del dorado).

### Tipografía (self-host con `next/font`)

- **Display — Cinzel (R1):** títulos H1–H2, nombres de nivel y números grandes. Lapidaria romana (sus minúsculas son versalitas): inscripción grabada en piedra, eco de grimorio y cartel clásico. Usar con moderación; tracking neutro o ligeramente negativo solo en tamaños ≥32px (es más ancha que Bodoni). `next/font`, `display: optional`, fallback métrico serif.
- **Cuerpo — Atkinson Hyperlegible:** todo el texto de lectura y UI. Diseñada para máxima legibilidad (encaja con el compromiso de accesibilidad del proyecto).
- **Datos — Spline Sans Mono:** cronómetro, XP, rachas, tablas de estadísticas (`font-variant-numeric: tabular-nums`).
- Escala: 13 / 15 / 17 (base) / 20 / 24 / 32 / 44 / 60. Cuerpo a 17px, line-height 1.6, medida de lectura máx. 68ch en lecciones.

### Espaciado, forma, sombra

Grid de 4px. Radios: 10px controles, 16px tarjetas. **Los naipes conservan ratio 5:7 y su volteo; desde R2a llevan el marco ornamental de esquinas recortadas (`ornate-frame-sutil`) en lugar del radio de 12px.** Sombras suaves y cálidas (`0 8px 24px rgb(0 0 0 / .35)` en oscuro). Bordes 1px siempre visibles sobre fieltro (no depender solo de sombra).

## Componentes (shadcn/ui como base + propios)

- Propios: `RouteMap` (niveles + naipes), `CourseCard` (naipe), `LessonShell` (layout lección), `VideoEmbed` (facade con miniatura + play; soporta youtube-nocookie/vimeo/file con `<track>` VTT), `PracticeTimer`, `MasteryDial` (dominio 0–5), `StreakFlame` (racha; icono propio: cerilla/llama de vela mejor que flama genérica), `ActivityHeatmap`, `XpToast`, `ChecklistPanel`, `RubricForm`, `AdminTable`, `MarkdownEditor` (textarea + preview), `EmptyState`.
- De shadcn: button, input, dialog, dropdown, tabs, toast, progress, badge, sheet (móvil), tooltip, alert.
- Iconos: Lucide; tamaño 20, trazo 1.75.

## Layout por pantalla (resumen)

- **App shell:** sidebar izquierda 240px (logo, Dashboard, Ruta, Práctica, Técnicas, Progreso; abajo perfil y tema). En móvil: barra inferior de 4 ítems + sheet. Contenido máx. 1100px centrado.
- **Dashboard:** fila 1: "Continuar" (tarjeta grande con la lección pendiente) + racha y XP a la derecha. Fila 2: repasos de hoy (chips de técnicas) + minutos de práctica de la semana (barras). Fila 3: últimos logros.
- **Ruta:** niveles en vertical como "mesas" de tapete; dentro, los naipes-curso en fila con % y candado si procede; cabecera de nivel con nombre en display (Cinzel) + hito de salida.
- **Curso:** *(migrada a R2 en R2b-1)* hero compacto con `ornate-frame` protagonista + veladura, eyebrow del nivel y título `heading-gilded` (título, resumen, horas, progreso en oro) + acordeón de módulos sobre `felt-texture` con marco sutil por módulo y fade-up escalonado; icono por tipo, check dorado al completar.
- **Lección:** *(migrada a R2 en R2b-1)* columna única 68ch; vídeo arriba (16:9, facade con marco sutil); contenido markdown; `ChecklistPanel` pegajoso al final en desktop (panel lateral ≥ 1280px); barra inferior fija: ← anterior · Marcar completada · siguiente →. Notas en un `sheet` lateral. **Regla de oro:** la columna de lectura (68ch) vive sobre `reading-surface` — fieltro casi sólido (95 % de `--card`) y **sin textura** bajo el texto corrido: la dirección (marcos, eyebrows, gilded, recursos en oro, quiz/rúbrica/notas) vive en el perímetro; la legibilidad manda en el centro. Tipografía y medida del markdown intactas.
- **Práctica:** *(migrada a R2 en R2b-2)* cronómetro protagonista (dígitos Spline Mono 60px) con marco sutil + eyebrow pero **superficie casi sólida** (`reading-surface` gana a la veladura): regla de oro — los dígitos no compiten con la atmósfera, usable con una mano a 360px (áreas táctiles ≥44px). Selector/registro manual y el historial del día/semana en tarjetas con marco sutil + veladura y eyebrows.
- **Técnica:** *(migrada a R2 en R2b-2)* listado en tarjetas con marco sutil + veladura y `MasteryDial` armonizado (oro; dominio pleno 5 en `success-ink`). Ficha: cabecera `ornate-frame` protagonista con `MasteryDial` + próxima fecha de repaso, editor de dominio enmarcado, descripción sobre `reading-surface`, lecciones e historial.
- **Progreso:** *(migrada a R2 en R2b-2)* secciones enmarcadas; heatmap 26 semanas y barras por categoría sobre **superficie casi sólida** (gráficas protegidas como la lectura), rampa de celdas verde-noche (vacío `--border`; actividad en oro 54/74/100 %; **AA recalculada vs fondo: L0 1.53 · L1 3.28 · L2 5.01 · L3 8.09**) con tabla sr-only y tooltips del tema intactos; tabla de técnicas por dominio con eyebrows.
- **Perfil:** *(migrada a R2 en R2b-2)* vitrina de logros enmarcada con **medallones hexagonales** por logro (icono oro si conseguido, atenuado si no) y eyebrow de sección.
- **Públicas:** *(migradas a R2 en R2b-2)* landing como **escaparate atmosférico** (atmósfera presente bajo presupuesto y motion-safe; `heading-gilded` a gran escala, medallón decorativo, CTA a `/register` y `/login` en oro; reduced-motion la deja estática). `/login` y `/register` heredan el shell sobrio: tarjeta del formulario con marco sutil y título dorado, formularios accesibles intactos.
- **Admin:** layout propio sobrio (sin tapete): tablas densas, formularios en dos columnas, preview de markdown a la derecha. **Queda FUERA del Tapete por decisión propia** (R2).

## Movimiento (ampliado en R1; atmósfera y navegación en R2a)

Una sola pieza orquestada (el volteo de naipe, 350ms ease-out, se conserva) + un catálogo de microinteracciones discretas + la atmósfera ambiental de R2a (ver §Ornamentos y su presupuesto). Reglas comunes para interacción: **150–500ms, ease-out, CSS/Tailwind puro**, y TODO — transiciones, desplazamientos de hover y atmósfera — dentro de `@media (prefers-reduced-motion: no-preference)` / `motion-safe:`. Con `prefers-reduced-motion` la página es completamente estática. Antipatrones de movimiento: ver §Antipatrones (reformulados en R2a).

Catálogo R1 + R2a:

| Pieza | Interacción | Especificación |
|---|---|---|
| Naipe (CourseCard) | hover / focus | Elevación −4px + inclinación 3D sutil (`rotate3d` ~2.5°) + halo dorado difuso (`--accent-glow`), 250ms (R2a: sin anillo nítido de 1px — chocaba con las esquinas recortadas del marco) |
| Botón primario | hover / focus | Halo `--accent-glow` (box-shadow 18px), 200ms |
| Nav lateral | activo / hover | Barra indicadora Latón (2px) que crece en altura, 200ms; activo a altura completa |
| Tarjetas dashboard | hover | Elevación −2px + sombra cálida + borde dorado al 20 %, 200ms |
| Enlaces de contenido | hover / focus | Subrayado base permanente (Dorso) + segunda línea dorada que crece de 0→100 %, 200ms |
| Anillo de foco | focus-visible | Glow `--accent-glow` ADEMÁS del anillo de 2px (el anillo nunca se sustituye) |
| Check de lección | al completar | 150ms (existente) |
| Toast XP | aparición | Sube y se desvanece (existente, vía sonner) |
| Entrada de secciones (R2a) | montaje de página | Fade-up 450ms ease-out, una vez, escalonado 70ms por bloque (`--enter-i`) |
| Transición de ruta (R2a) | navegación | Fade del main 220ms vía `template.tsx` (View Transitions API descartada: exige flag experimental en Next 16) |
| Niebla y motas (R2a) | ambiental, fondo | Deriva 66–84s / flotación 16–26s, `transform`-only, ≤1 % CPU; ver presupuesto en §Ornamentos |

## Voz y microcopy (UI en español)

- Verbos directos y consistentes: "Marcar completada" → toast "Lección completada · +15 XP". "Empezar práctica" / "Terminar sesión".
- Estados vacíos que orientan: *"Aún no has registrado práctica hoy. Diez minutos de doble volteo cuentan."* + botón "Empezar cronómetro".
- Errores concretos, sin disculpas vagas: *"No se pudo guardar la sesión. Comprueba la conexión y reintenta."*
- Sin jerga de sistema (nunca "registro insertado"); tono cercano, nada de mayúsculas gritonas.

## Accesibilidad (WCAG 2.2 AA — checklist de verificación por pantalla)

1. Contraste: texto ≥ 4.5:1, UI/íconos ≥ 3:1 (verificar tokens en ambos temas; reglas de uso del dorado arriba).
2. Teclado: todo operable; orden lógico; focus visible (anillo Latón 2px + offset); skip-link al contenido.
3. Semántica: landmarks (`nav/main/aside`), encabezados jerárquicos, listas reales; el mapa de ruta navegable como lista, no solo visual.
4. Formularios: label siempre, errores asociados con `aria-describedby`, mensajes anunciados (`aria-live=polite` para toasts/XP).
5. Vídeo: subtítulos VTT en vídeos propios; transcripción/resumen en el `content_md`; el facade tiene nombre accesible ("Reproducir vídeo: Doble volteo").
6. Objetivos táctiles ≥ 44×44; el cronómetro usable con una mano en móvil.
7. `prefers-reduced-motion` respeta TODO. Tema: arranque fijo en oscuro «Función» (R2a-fix; ya no sigue `prefers-color-scheme`) + toggle persistente al claro «Ensayo».
8. `lang="es"`; textos de iconos con `aria-label`; tooltips también accesibles por foco.
9. Heatmap y gráficas con alternativa textual (tabla oculta accesible o resumen).
10. Zoom 200 % sin pérdida de contenido; sin scroll horizontal a 360px.

## Antipatrones prohibidos (reformulados en R2a)

Carruseles automáticos · spinners infinitos sin skeleton · **confeti de celebración** (partículas que estallan al completar algo) · **parallax agresivo** (capas ligadas al scroll) · texto dorado sobre papel claro · modales para flujos largos (usar páginas) · degradados morados genéricos de plantilla.

**Excepción acotada (R2a):** la atmósfera ambiental de fondo (niebla y
motas) está permitida SOLO con su presupuesto: `motion-safe`, detrás del
contenido, `transform`/`opacity`-only (compositor), ≤1 % CPU, apagada
con `prefers-reduced-motion` y en tema claro. No es celebración ni
responde al scroll: es luz de sala.
