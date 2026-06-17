# 03 · Especificación funcional

Prioridades: **P0** = MVP imprescindible · **P1** = primera iteración tras MVP · **P2** = deseable. Cada historia incluye criterios de aceptación (CA) verificables.

## Roles

- **student:** consume contenido, registra práctica, ve su progreso.
- **admin:** todo lo anterior + CMS completo + gestión de usuarios. (El primer usuario registrado vía seed es admin.)

## Épica A — Autenticación y cuenta (P0)

- **A1. Registro e inicio de sesión** con email/contraseña (better-auth). CA: contraseña ≥ 10 caracteres; sesión por cookie httpOnly; rutas privadas redirigen a `/login`; logout funciona.
- **A2. Perfil básico:** nombre visible, avatar (inicial generada; subida de imagen P2), cambio de contraseña. CA: edición persiste y se refleja en la barra superior.
- **A3. Ajustes:** toggle "modo libre" (desbloquea navegación), tema claro/oscuro, recordatorio de práctica por email (P2). CA: el modo libre se respeta en catálogo y lección.
- **A4 (P1). Recuperación de contraseña** por email (requiere SMTP).

## Épica B — Catálogo y ruta de aprendizaje (P0)

- **B1. Mapa de ruta:** página principal de aprendizaje con los 6 niveles en vertical, cursos como tarjetas con estado (bloqueado/disponible/en curso/completado) y % de progreso. CA: el estado se calcula por prerequisitos; los bloqueados muestran qué falta para desbloquear.
- **B2. Página de curso:** descripción, horas estimadas, lista de módulos→lecciones con check de completadas, botón "Continuar" que lleva a la primera lección pendiente. CA: el orden respeta `order`; las lecciones bloqueadas (anterior no completada) se indican, salvo modo libre.
- **B3. Desbloqueo:** un nivel se desbloquea al completar los cursos obligatorios (incl. hito) del anterior; dentro de un curso, las lecciones son secuenciales. CA: probado con seed N0→N1.
- **B4. Búsqueda (P1):** buscador global por título de curso/lección/técnica.

## Épica C — Lección (P0)

- **C1. Vista de lección:** título, breadcrumb, contenido markdown renderizado (encabezados, imágenes, tablas, callouts), vídeo incrustado responsive (YouTube `youtube-nocookie`/Vimeo/MP4), lista de recursos descargables, navegación anterior/siguiente. CA: una lección sin vídeo no muestra hueco; el embed no carga hasta interacción (facade) para rendimiento.
- **C2. Completar lección:** botón "Marcar como completada" → guarda progreso, suma XP, registra actividad del día, avanza a la siguiente. CA: idempotente; revierte con "Desmarcar".
- **C3. Checklist de práctica (lecciones `video`/`practice`):** criterios marcables persistentes por usuario; en lecciones `practice`, completar exige checklist al 100 % + al menos una sesión de práctica registrada. CA: el botón de completar se habilita solo al cumplirse.
- **C4. Notas personales:** editor de texto por lección, autosave. CA: notas privadas por usuario, visibles al volver.
- **C5. Hitos (`milestone`):** muestran rúbrica de autoevaluación (3–6 criterios, 1–5) y campo de reflexión; completar exige rúbrica rellena. CA: la rúbrica queda guardada en el historial.
- **C6 (P1). Marcadores/favoritos** de lecciones para repaso rápido.

## Épica D — Progreso y dashboard (P0)

- **D1. Dashboard de inicio:** saludo, racha actual, "Continuar donde lo dejaste", próximos repasos pendientes, XP/nivel de jugador, minutos de práctica de la semana (mini-gráfica), últimos logros. CA: todos los datos provienen de la BD real; con usuario nuevo muestra estados vacíos útiles.
- **D2. Página de progreso:** % por nivel y curso, calendario de actividad (heatmap estilo GitHub), horas de práctica por categoría (cartas/monedas/…), técnicas por estado de dominio. CA: heatmap de 26 semanas; tooltips accesibles.
- **D3. Racha:** un día cuenta si se completa una lección o se registran ≥ 10 min de práctica. CA: racha y récord correctos cruzando zona horaria Europe/Madrid.

## Épica E — Diario de práctica y técnicas (P0)

- **E1. Cronómetro de práctica:** widget iniciar/pausar/terminar; al terminar se elige técnica (o lección), autoevaluación 1–5 y notas. CA: sobrevive a recarga (persistencia local del timer en curso); mínimo registrable 1 min.
- **E2. Registro manual:** añadir sesión pasada (fecha, duración, técnica, nota). CA: validación de fechas no futuras.
- **E3. Ficha de técnica:** descripción, lecciones que la enseñan, historial de sesiones, dominio actual (0–5) editable con honestidad guiada ("¿la ejecutas sin mirar? ¿ante público?"), próxima fecha de repaso. CA: cambiar dominio recalcula el repaso.
- **E4. Repaso espaciado (P1):** cola "Para repasar hoy" con técnicas cuyo `next_review_at` venció. Intervalos: 1, 3, 7, 14, 30, 60 días; autoevaluación < 3 en repaso reinicia a 1–3 días. CA: registrar práctica de una técnica vencida la saca de la cola y programa la siguiente.

## Épica F — Quizzes (P0 básico)

- **F1. Quiz de lección:** preguntas de opción múltiple/verdadero-falso, corrección inmediata con explicación, nota mínima 80 % para completar. CA: intentos ilimitados; se guarda el mejor; preguntas en orden aleatorio.
- **F2 (P2). Tipos extra:** ordenar pasos, emparejar término-definición.

## Épica G — Gamificación (P0 básico, P1 completo)

- **G1. XP:** article 10 · video 15 · practice 20 · quiz aprobado 25 · milestone 100 · +1 XP/min de práctica (tope 60/día). CA: el total coincide con el log de actividad.
- **G2. Niveles de jugador** (cosméticos, distintos de los niveles del currículo): umbrales de XP con nombres temáticos (Iniciado, Aprendiz, Ilusionista, Prestidigitador, Maestro, Profesional).
- **G3. Logros (P1):** sistema por criterios (primera lección, primer hito, racha 7/30, 10 h de práctica, curso X completado…). CA: otorgado una sola vez; toast + vitrina en perfil.

## Épica H — Admin CMS (P0)

- **H1. CRUD de contenido:** niveles (solo edición de textos), cursos, módulos, lecciones, técnicas, recursos, quizzes y sus preguntas. CA: validación con mensajes claros; borrado con confirmación y protección si hay progreso asociado (soft-archive).
- **H2. Editor de lección:** formulario con markdown (preview en vivo), URL de vídeo con autodetección de proveedor, gestor de checklist, selector de técnicas asociadas, subida de imágenes (a `/uploads`, P0 simple) y estado borrador/publicado. CA: una lección en borrador es invisible para students.
- **H3. Reordenación:** drag & drop (o botones ↑/↓ accesibles) de cursos, módulos y lecciones. CA: el orden persiste y se refleja al instante.
- **H4. Usuarios:** listado, cambio de rol, desactivación. CA: un admin no puede auto-degradarse si es el único.
- **H5 (P1). Vista previa "como alumno"** de contenido en borrador.

## Épica I — Plataforma (transversal, P0)

- **I1. Accesibilidad WCAG 2.2 AA** (detalle en `06`): teclado completo, focus visible, contraste, `prefers-reduced-motion`, vídeos propios con subtítulos.
- **I2. Responsive:** móvil 360 px → escritorio; el cronómetro y la lección son cómodos en móvil (practicar con el móvil al lado es el caso de uso real).
- **I3. Rendimiento:** LCP < 2,5 s en lección; imágenes optimizadas; embeds con facade.
- **I4. Estados vacíos, carga y error** definidos en cada pantalla (con orientación, no solo mensaje).

## Mapa de pantallas

| Ruta | Pantalla | Rol |
|---|---|---|
| `/` | Landing mínima (qué es Claude Solutions + login) | público |
| `/login`, `/register` | Auth | público |
| `/app` | Dashboard | student |
| `/app/ruta` | Mapa de ruta por niveles | student |
| `/app/cursos/[slug]` | Detalle de curso | student |
| `/app/leccion/[slug]` | Lección | student |
| `/app/practica` | Diario de práctica + cronómetro | student |
| `/app/tecnicas`, `/app/tecnicas/[slug]` | Técnicas y ficha | student |
| `/app/progreso` | Estadísticas y heatmap | student |
| `/app/perfil`, `/app/ajustes` | Cuenta | student |
| `/admin` | Resumen CMS | admin |
| `/admin/cursos…`, `/admin/lecciones…`, `/admin/tecnicas…`, `/admin/quizzes…`, `/admin/usuarios` | CRUD | admin |

## Reglas de negocio clave (resumen)

1. Completar lección `practice` ⇒ checklist 100 % + ≥ 1 sesión de práctica vinculada.
2. Completar curso ⇒ todas sus lecciones publicadas completadas.
3. Desbloquear nivel N ⇒ cursos obligatorios de N-1 completados (salvo modo libre).
4. Racha ⇒ lección completada o ≥ 10 min práctica en el día (Europe/Madrid).
5. XP nunca se resta al desmarcar; se registra un ajuste (evita farmeo, mantiene log honesto).
