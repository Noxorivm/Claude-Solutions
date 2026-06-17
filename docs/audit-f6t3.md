# Auditoría F6-T3 — WCAG, Lighthouse y microcopy

Fecha: 12/06/2026 · build de producción local (`pnpm start`).
Método: barrido Playwright propio por pantalla (axe no es dependencia)
con checks de: `lang`, un único `h1`, landmarks (`main`/`nav`),
skip-link, labels de TODOS los campos, `alt` en imágenes, nombre
accesible en botones/links, foco visible al tabular, scroll horizontal
a 360px y a 640px (≈ zoom 200% sobre 1280), targets táctiles de la
barra de lección en 390px, tooltips/tabla del heatmap y estados vacíos
con usuario recién creado. El contraste de tokens se verificó a mano
(cálculo de luminancia relativa) y con el audit `color-contrast` de
Lighthouse en ambos temas de las tres páginas medidas.

## Tabla pantalla × checklist (docs/06 §Accesibilidad, 10 puntos)

Leyenda: ✓ = limpio en el barrido final. Los números remiten a los 10
puntos del checklist. Hallazgos: ver tabla siguiente.

| Pantalla              | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --------------------- | - | - | - | - | - | - | - | - | - | -- |
| Landing               | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | — | ✓  |
| Login                 | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | ✓  |
| Register              | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | ✓  |
| Dashboard             | H3 | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ruta                  | H3 | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | — | ✓ |
| Curso                 | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | — | ✓  |
| Lección · article     | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | ✓  |
| Lección · video       | ✓ | H4 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Lección · practice    | ✓ | H4 | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | ✓ |
| Lección · quiz        | H1 | H4 | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | ✓ |
| Lección · milestone   | H1 | H4 | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | ✓ |
| Práctica              | H1 | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | ✓  |
| Técnicas + ficha      | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | ✓  |
| Progreso              | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | H2 | H2 |
| Perfil                | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | — | ✓  |
| Admin · resumen       | ✓ | H5 | ✓ | — | — | ✓ | ✓ | ✓ | — | ✓ |
| Admin · cursos+ficha  | H1 | H5 | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | ✓ |
| Admin · lecciones+ed. | H1 | H5 | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | ✓ |
| Admin · técnicas      | ✓ | H5 | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | ✓  |
| Admin · quizzes       | H1 | H5 | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | ✓ |
| Admin · usuarios      | H1 | H5 | ✓ | — | — | ✓ | ✓ | ✓ | — | ✓ |

— = no aplica (sin formularios/vídeo/gráficas en esa pantalla).
Punto 5 (vídeo): facade con nombre accesible verificado; los VTT de
vídeos propios quedan como práctica editorial al subir cada vídeo (el
componente ya los soporta desde F2-T3).

## Hallazgos y correcciones

| ID | Hallazgo | Corregido en |
| -- | -------- | ------------ |
| H1 | Deuda conocida: texto de error/estado en Corazones `#d4564b` a ~4,2:1 (oscuro) — afecta a errores de formularios (alumno y admin), badges Archivado/Desactivada/Sin quiz/Repaso vencido, botones de borrado y al texto de `button/badge` variant destructive | Token `--danger-ink` nuevo: `#e0786e` (oscuro: 5,7:1 sobre Telón, 5,9:1 sobre Fieltro, 5,3:1 sobre surface-2) y `#a93226` (claro: 5,8:1 sobre Papel). Aplicado en 23 puntos de texto + icono de los toasts de error |
| H2 | Progreso desbordaba +106px a 360px: la `<table>` sr-only del heatmap ignora `width:1px` (las tablas se expanden a su contenido) y empujaba el scroll del documento | Tabla envuelta en `div.sr-only` (la semántica de tabla queda intacta) — `activity-heatmap.tsx` |
| H3 | Tema claro: link activo de la sidebar (Latón oscuro `#8a6a10` sobre accent `#ece3d2`) a 3,97:1 — detectado por Lighthouse `color-contrast` | Latón claro afinado a `#7a5e0e` (4,8:1 sobre accent, 6,1:1 en botones primary); regla del dorado de docs/06 conservada. `--ring`, `--chart-1` y sidebar actualizados |
| H4 | Links Anterior/Siguiente de la barra de lección sin nombre accesible en móvil (texto `hidden sm:inline` + chevrons `aria-hidden`) — Lighthouse `link-name` | `aria-label` fijo en ambos links — `lesson-bar.tsx` |
| H5 | El layout admin no tenía skip-link (el del alumno sí) | Skip-link + `main#contenido tabIndex=-1` añadidos a `(admin)/admin/layout.tsx` |
| H6 | Deuda conocida: icono de racha era el `Flame` genérico de Lucide | `StreakFlameIcon` propio (cerilla encendida, viewBox 24, trazo 1.75, `currentColor`, `aria-hidden`) — `streak-flame-icon.tsx` |
| H7 | LCP móvil simulado de ~7s por repintado tardío del H1 al llegar la webfont (swap) | `display: "optional"` en las tres fuentes de next/font (fallbacks con métricas ajustadas: sin salto visual; con caché la fuente real aparece siempre) |

Verificaciones sin hallazgo: reduced-motion (flip del naipe y facade con
`motion-reduce:transition-none`; resto de microinteracciones vía Radix/
sonner, que lo respetan), heatmap con tooltips operables por foco y
tabla alternativa, targets de la barra de lección ≥44px en 390px,
zoom 200% limpio en dashboard/lección/editor admin, y los 10 puntos
restantes por pantalla según la tabla.

Resultado final del barrido: **31/31 pantallas limpias**.

## Lighthouse (preset desktop, sesión real, build de producción)

| Página            | Perf | A11y | Best Practices | SEO |
| ----------------- | ---- | ---- | -------------- | --- |
| /app (dashboard)  | 97   | 100  | 100            | 100 |
| /app/ruta         | 97   | 100  | 100            | 100 |
| /app/leccion/*¹   | 97   | 100  | 100            | 100 |

¹ Lección sembrada con markdown realista (tabla, callout, listas) y
vídeo de YouTube con facade; revertida tras la medición.

Nota de método: se mide con `--preset=desktop` (10 Mbps, CPU 1×), el
perfil acorde al uso del producto (docs/06 diseña desktop-first con
sidebar; el estudio con baraja es de escritorio). En el preset móvil
(Moto G + slow 4G simulado) el modelo *lantern* infla el LCP del H1 a
~6,4s pese a que el paint observado es de 462ms (FCP = LCP reales):
al medir contra localhost todos los chunks JS inician antes del primer
paint y lantern los encadena al LCP simulado. Las métricas móviles no
sintéticas son sanas: TBT 30ms, CLS 0, FCP 1,4s.

## Microcopy (docs/06 §Voz)

Revisión completa de `strings.ts`. Verbos y tono ya consistentes
("Marcar como completada", "Terminar sesión", errores concretos).
Cambios:

| String | Antes | Ahora | Motivo |
| ------ | ----- | ----- | ------ |
| `common.genericError` | "No se pudo completar la operación. Reintenta en unos segundos." | "Algo ha fallado. Comprueba la conexión y reintenta." | "la operación" era jerga de sistema |
| `dashboard.practiceEmpty` | "…cuando estrene el diario con cronómetro." | "Aún no has practicado esta semana. Diez minutos hoy encienden la primera barra." | Prometía una feature que existe desde F3-T1 |
| `dashboard.achievementsEmpty` | "La vitrina se abrirá pronto…" | "Aún sin logros. Completa tu primera lección y estrena la vitrina." | Prometía una feature que existe desde F4-T3 |
| `pages.comingSoon` / `admin.comingSoon` | "Próximamente." | (eliminados) | Sin uso desde F5-T3: ya no hay placeholders |

## Estados vacíos (usuario recién creado)

Recorrido completo: dashboard (continuar→"Empieza por aquí" + CTA,
racha, práctica y logros orientan tras los cambios de microcopy),
práctica (texto + botón "Empezar cronómetro" que enfoca el cronómetro),
técnicas (catálogo siempre con contenido; ficha con "Diez minutos hoy
ya cuentan" + CTA), progreso (heatmap vacío con leyenda, categorías y
dominio con texto + CTA "Empezar cronómetro"/"Ver ruta"), perfil
(vitrina "X de Y" con pendientes atenuados). Todos orientan con texto
y acción.
