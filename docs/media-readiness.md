# Media readiness — auditoría y verificación de tuberías (MEDIA-T1)

> Inventario de la media (vídeo + imágenes) presente/ausente por lección
> en N0–N1, y veredicto **verificado** de que las tuberías de embed de
> vídeo y de render de imagen funcionan de extremo a extremo. Esta tarea
> **no** crea vídeos ni imágenes (son producción del autor) ni incrusta
> media de terceros: solo inventaría y verifica la infraestructura.
> Fecha: 15/06/2026. Alcance: lecciones de N0–N1 con cuerpo redactado.

## Veredicto de readiness: INFRAESTRUCTURA OK ✅

Las dos tuberías están listas para recibir la producción del autor. Se
verificó de forma **reversible** (nada de prueba quedó persistido):

**Embed de vídeo** — `lib/video.ts` + `VideoEmbed` (facade) + editor admin:

- Parser de proveedor correcto para **YouTube** (`youtu.be`,
  `watch?v=`, `shorts`/`embed`), **Vimeo** (`vimeo.com/NNN`,
  `player.vimeo.com`) y **archivo** (`.mp4`/`.webm`/…), verificado a
  través del render real.
- La facade es **perezosa**: no hay `<iframe>` en el DOM hasta el clic;
  nombre accesible «Reproducir vídeo: {título}»; miniatura de YouTube
  en la portada; al reproducir, YouTube va por **youtube-nocookie** con
  `autoplay`, Vimeo por `player.vimeo.com`, y los archivos propios por
  `<video>` con **hueco de pista `<track>` VTT** cableado en el
  componente (se activa al pasar `trackUrl`). Responsive (`aspect-video`).
- El **editor del admin autodetecta** el proveedor al pegar la URL
  (badge «YouTube/Vimeo detectado», F5-T2).

**Render de imagen** — subida admin + `MarkdownContent`:

- `POST /api/admin/uploads` (admin, lista blanca de MIME + firma binaria
  + ≤5 MB, nombre = hash) devuelve `/uploads/{hash}.ext`; el endpoint
  `GET /uploads/[name]` lo sirve con `image/*` y caché inmutable.
- `MarkdownContent` (rehype-sanitize, esquema GitHub) renderiza `![alt](…)`
  como `<img>` con `alt`, responsive (`max-width:100%`, `height:auto`,
  esquinas redondeadas). El botón «Subir imagen» del editor sube e
  inserta el markdown automáticamente.

No se detectaron carencias de infraestructura. **Lo único que falta es
la media en sí, que la aporta el autor** (siguiente sección).

## Inventario — resumen por nivel y tipo

| Nivel | Tipo | Lecciones | Con `video_url` | Callout «vídeo pendiente» | Imágenes `![…]` |
|---|---|---:|---:|---:|---:|
| N0 | article | 20 | — | — | 0 |
| N0 | video | 16 | 0 | 16 | 0 |
| N0 | practice | 2 | — | — | 0 |
| N0 | quiz | 1 | — | — | 0 |
| N0 | milestone | 2 | — | — | 0 |
| N1 | article | 5 | — | — | 0 |
| N1 | video | 23 | 0 | 23 | 0 |
| N1 | practice | 2 | — | — | 0 |
| N1 | quiz | 1 | — | — | 0 |
| N1 | milestone | 3 | — | — | 0 |
| **Total** | | **75** | **0** | **39 / 39** | **0** |

Lectura: **39 lecciones de vídeo** (16 en N0, 23 en N1), **todas** con
su callout «vídeo pendiente de grabar» y **ninguna** con `video_url`
poblado todavía → las 39 están por grabar. **Cero imágenes** referenciadas
en todo N0–N1 → todo el «paso a paso ilustrado» (docs/02 §2) está por
aportar.

## Checklist de producción del autor — VÍDEOS (39 por grabar)

Pega la URL (YouTube «no listado», Vimeo o archivo propio) en el campo
de vídeo del editor de cada lección; el proveedor se autodetecta y la
facade aparece sola. Sube los vídeos como **propios** o «no listados»
(docs/02 §12: media propia; terceros se citan, no se suben).

### Curso 0.1 · Bienvenido a la magia (M3)
- [ ] `0-1-hermanas-gemelas` — Efecto automático nº1: «Las hermanas gemelas»
- [ ] `0-1-21-cartas` — Las 21 cartas
- [ ] `0-1-reloj-imposible` — El reloj imposible
- [ ] `0-1-hazlo-como-yo` — Hazlo como yo (Do as I do)
- [ ] `0-1-prediccion-con-dados` — Predicción con dados
- [ ] `0-1-prediccion-matematica` — Efecto automático nº2: predicción matemática

### Curso 0.2 · Magia con objetos cotidianos (M1, M2)
- [ ] `0-2-salto-imposible` — El salto imposible
- [ ] `0-2-esposas-locas` — Esposas locas (versión básica)
- [ ] `0-2-goma-rota-recompuesta` — La goma rota y recompuesta
- [ ] `0-2-gomas-enlazadas` — Gomas enlazadas
- [ ] `0-2-clips-enlazados` — Clips que se enlazan en un billete
- [ ] `0-2-moneda-que-atraviesa` — Moneda que atraviesa (versión automática)
- [ ] `0-2-servilleta-desaparecida` — Azúcar y servilleta desaparecida (lapping)
- [ ] `0-2-servilleta-rota-recompuesta` — Servilleta rota y recompuesta
- [ ] `0-2-prediccion-movil` — Predicción con el móvil
- [ ] `0-2-apuestas-imposibles` — Apuestas imposibles

### Curso 1.1 · Cartomagia fundamental I (M1–M5)
- [ ] `1-1-sujecion-mecanico` — Sujeción del mecánico y dar cartas
- [ ] `1-1-extension-en-cinta` — Extensión en cinta y en mesa; abanico
- [ ] `1-1-mezclas-basicas` — Mezcla por arrastre y americana básicas
- [ ] `1-1-carta-clave` — Carta clave: localización tras mezcla
- [ ] `1-1-control-por-arrastre` — Control por mezcla por arrastre (injog)
- [ ] `1-1-pinky-break-doble-corte` — Separación con el meñique y doble corte
- [ ] `1-1-forzaje-cruzado` — Forzaje cruzado y gestión del tiempo muerto
- [ ] `1-1-forzaje-del-reparto` — Forzaje del reparto y del 10-20
- [ ] `1-1-prediccion-imposible` — Predicción imposible con forzaje cruzado
- [ ] `1-1-doble-volteo` — Doble volteo básico
- [ ] `1-1-limpiar-el-doble` — Errores del doble y cómo limpiarlo
- [ ] `1-1-carta-que-cambia` — La carta que cambia en la mano del espectador
- [ ] `1-1-carta-ambiciosa` — La carta ambiciosa (versión básica)

### Curso 1.2 · Numismagia I (M1–M3)
- [ ] `1-2-empalme-de-dedos` — Empalme de dedos (finger palm)
- [ ] `1-2-empalme-clasico` — Empalme clásico (introducción)
- [ ] `1-2-pase-frances` — Pase francés (French drop)
- [ ] `1-2-desaparicion-por-retencion` — Desaparición por retención
- [ ] `1-2-reaparicion` — Reaparición tras la rodilla o el codo
- [ ] `1-2-construccion-rutina-moneda` — Construcción de la rutina de moneda

### Curso 1.3 · Cuerdas y esponjas (M1, M2)
- [ ] `1-3-esponjas-en-manos` — Apariciones/desapariciones en manos del espectador
- [ ] `1-3-rutina-dos-bolas` — Rutina de 2 bolas
- [ ] `1-3-cuerda-cortada` — Cuerda cortada y recompuesta (versión básica)
- [ ] `1-3-nudos-que-se-disuelven` — Nudos que se disuelven

## Checklist de producción del autor — IMÁGENES (0 aportadas)

Hoy **ninguna** lección referencia imágenes. El «paso a paso ilustrado»
de docs/02 §2 está pendiente por completo. Recomendación de prioridad
(donde una imagen aporta más):

1. **Lecciones de técnica/efecto** (las 39 de vídeo + las 4 `practice`):
   diagramas de **posición de manos** y de **ángulos** complementan el
   vídeo y sirven de referencia rápida sin reproducir.
2. **Artículos con tablas o esquemas** (p. ej. el reloj imposible, la
   estructura de un set): un esquema simple ayuda a fijar la idea.

Flujo para aportarlas: en el editor de la lección, botón **«Subir
imagen»** → se sube (PNG/JPG/WebP/GIF, ≤5 MB) y se inserta
`![descripción](/uploads/…)` en el cursor; edita el `alt` para que sea
descriptivo (accesibilidad). Imágenes **propias**; nada de material de
terceros con derechos ni generación por IA de técnica (docs/02 §12).

## Metodología de verificación (reversible)

- **Vídeo:** se asignó secuencialmente a `0-1-hermanas-gemelas` una URL
  de prueba de YouTube, otra de Vimeo y otra de archivo `.mp4`; se
  comprobó el parser, la facade perezosa, el nombre accesible, los
  embeds (youtube-nocookie/player.vimeo) y el `<video>`; y la
  autodetección del editor. La URL de prueba se **borró** al terminar.
- **Imagen:** se subió un PNG 1×1 de prueba por `POST /api/admin/uploads`,
  se sirvió por `GET /uploads/…` y se renderizó vía `MarkdownContent` en
  el preview del editor (sin guardar ninguna lección); la subida se
  **borró** de la BD y del disco al terminar.
- Reversión confirmada: cero `video_url` de prueba, cero subidas de
  prueba (BD y disco), `free_roam` restaurado. Sin lecciones publicadas
  nuevas; `content/` intacto.
