# 02 · Currículo — Aprender a usar Claude

Este documento es la **fuente de verdad del contenido formativo** de Claude
Solutions y, más adelante, del **seed** de la base de datos. Diseña el currículo
de extremo a extremo: niveles 0–1 a nivel de lección (título, tipo y objetivo),
niveles 2–5 a nivel de módulo, el catálogo de habilidades, los principios
pedagógicos y el principio de voz que gobierna toda la redacción posterior.

> **Estado (CS-T2, 2026-06-17).** Esto es el **diseño** del currículo, no los
> cuerpos de lección. No toca el seed ni el código. La redacción de las
> lecciones, el volcado al seed y el remapeo de conceptos de la plataforma
> (técnicas → habilidades, etc.) son tareas posteriores (ver docs/07).

> **Anclaje.** Todo lo que sigue está anclado en la **documentación oficial de
> Anthropic vigente a la fecha de arriba** (ver §13 Fuentes). Modelos, funciones
> y nombres son los de hoy. Lo que no esté en doc oficial **no entra**, y lo
> incierto o cambiante se marca como tal. Claude cambia rápido: este documento
> se fecha y se revisa (§14).

---

## 1. Principios pedagógicos

Adaptados al oficio de usar Claude (la inspiración de formato viene de la
plataforma base; el contenido es nuevo).

1. **El hacer es el producto.** No basta con "leer sobre Claude": cada lección
   te hace abrir Claude y conseguir un resultado. Las lecciones de técnica
   exigen un ejercicio hecho, no solo visto.
2. **Aprender haciendo, con tareas tuyas.** Los ejemplos son cotidianos y,
   siempre que se puede, usas tus propios materiales (un correo, un PDF, una
   decisión real). Lo que practicas con algo tuyo se queda.
3. **Espiral, no línea recta.** Los conceptos reaparecen más hondos en niveles
   altos. "Dar contexto" aparece en N0 como un consejo y vuelve en N2 como
   diseño de prompts y en N5 como ingeniería de contexto para agentes.
4. **Honestidad sobre lo que Claude NO hace bien.** Desde el Nivel 0 se enseña
   que Claude puede equivocarse con seguridad ("alucinar"), que no sabe lo que
   pasó tras su fecha de corte salvo que busque en la web, y que no sustituye a
   un profesional. Verificar es parte de la habilidad, no un añadido.
5. **Anclado en doc oficial, siempre.** Cada explicación se apoya en la
   documentación oficial y la cita. No se inventan funciones ni modelos; lo
   incierto se marca y se revisa por el ritmo de cambios de Claude.
6. **De usuario a constructor.** El itinerario va de hablar con Claude en la app
   (N0–N1) a hacerlo actuar con tus herramientas (N3) y a construir con la API
   y sistemas agénticos en producción (N4–N5), sin saltos bruscos.

---

## 2. Principio de VOZ (gobierna toda la redacción)

**Cercano y profesional: como un amigo que sabe del tema y te acompaña.** Esta
voz manda sobre TODO lo que se escriba después —lecciones, microcopy, ejercicios,
quizzes, hitos—. Si una frase no suena a esto, se reescribe.

- **Tutea.** Hablas de tú a tú. "Vas a", "prueba esto", "fíjate en".
- **Frases directas y cortas.** Di lo que hay que hacer. Sin rodeos ni relleno.
- **Ejemplos cotidianos.** Un correo, la lista de la compra, un PDF del trabajo.
  Nada de ejemplos abstractos cuando puedes usar uno de la vida real.
- **Cero corporativismo y cero solemnidad.** Nada de "potencie su productividad
  con soluciones de IA de vanguardia". Hablas como una persona, no como un
  folleto.
- **Sin jerga gratuita.** Si una palabra técnica hace falta (token, prompt,
  API), la presentas una vez, en llano, y sigues. Si no hace falta, fuera.
- **Admite los límites.** "Esto Claude lo hace bien; esto, regular; aquí ten
  cuidado." La confianza se gana siendo honesto, no vendiendo.
- **Profesional en el rigor, cercano en la forma.** Cercano no es impreciso:
  cada afirmación está anclada en doc oficial y es exacta. Cercano es no
  aparentar —ni distancia de experto, ni euforia de vendedor—.

*Ejemplo de la voz, aplicado.* En vez de: «Claude es una solución de IA
conversacional de última generación que revoluciona su flujo de trabajo».
Escribe: «Claude es un asistente con el que hablas en lenguaje normal. Le pides
algo —resume esto, escríbeme aquello, explícame esto otro— y te responde. A
veces se equivoca; aprenderás a darte cuenta.»

---

## 3. Anatomía de una lección

Toda lección sigue esta plantilla (se reflejará en el editor del admin):

1. **Objetivo** — qué sabrás hacer al terminar (1–2 frases, en segunda persona).
2. **La idea clara** — el concepto en lenguaje llano y por qué importa.
3. **Ejemplo o demostración** — Claude haciéndolo, con una tarea concreta y real.
4. **Paso a paso** — cómo hacerlo tú, en orden, sin huecos.
5. **Errores comunes** — los 3–5 fallos típicos y cómo evitarlos (incluye, cuando
   aplica, qué NO esperar de Claude).
6. **Ejercicio práctico** — una tarea tuya para hacerlo ahora; criterios claros de
   "esto ya está".
7. **Recursos** — enlaces a la doc oficial citada y material de apoyo.

---

## 4. Tipos de lección

- `article` — explicación y teoría llana (la idea + ejemplo + errores comunes).
- `exercise` — práctica guiada: haces una tarea concreta en Claude y la registras
  (sustituye a la "práctica" de la plataforma base; el remapeo de la mecánica es
  tarea posterior).
- `quiz` — comprobación de opción múltiple con nota mínima.
- `milestone` — hito: una entrega real (una tarea resuelta de principio a fin)
  con rúbrica de autoevaluación; cierra un curso o nivel.
- `simulation` — **tipo previsto**: práctica en un simulador de conversación/uso
  dentro de la plataforma. Se nombra aquí para fijar el tipo; **el simulador se
  diseña aparte** (no entra en CS-T2).

---

## 5. Sistema de niveles

| Nº | Nombre | Foco | Hito de salida |
|---|---|---|---|
| 0 | **Primeros pasos** | Qué es Claude, la app y tus primeras conversaciones útiles | Resolver una tarea real tuya de principio a fin en el chat |
| 1 | **Conversar con criterio** | Dar contexto, iterar, traer tus materiales, personalizar | Resolver un encargo de varios pasos con tus documentos + web + un Proyecto |
| 2 | **El oficio del prompt** | Estructura, ejemplos, razonamiento y fiabilidad del prompt | Convertir una tarea recurrente en un prompt fiable y reutilizable |
| 3 | **Claude que actúa** | Proyectos, Artefactos, conectores/MCP, Skills, primer Claude Code | Automatizar un flujo real con Proyecto + conector/Skill + artefacto |
| 4 | **Construir con la API** | Consola, Mensajes, modelos, herramientas, coste y fiabilidad | Una pequeña app con la API (entrada → llamada → salida) con tool use |
| 5 | **Sistemas agénticos en producción** | Diseño de agentes, Agent SDK, MCP, Managed Agents, evals y operación | Un agente de extremo a extremo en un entorno real, con evals y plan de operación |

Desbloqueo: completar todos los cursos obligatorios de un nivel (incluido su
hito) desbloquea el siguiente. El **modo libre** permite saltarse esto.

> **Premisa de diseño:** el Nivel 0 asume **cero base técnica**. No hay código ni
> API hasta el Nivel 4. La curva sube despacio y en espiral.

---

## 6. Nivel 0 — Primeros pasos

> Anclaje: páginas de producto y ayuda (qué es Claude, planes y apps, búsqueda
> web, memoria, archivos) y la página oficial de modelos (§13 A, B).

### Curso 0.1 · Bienvenido a Claude (3 módulos)

**M1. Qué es Claude**
- L1 (article) ¿Qué es Claude?: un asistente de IA con el que hablas en lenguaje normal; objetivo: entender qué es y qué no es.
- L2 (article) Dónde vive Claude: app web, de escritorio (Mac/Windows) y móvil (iOS/Android), y los planes (Free, Pro, Max, Team, Enterprise); objetivo: saber por dónde empezar gratis.
- L3 (article) Las familias de modelos (Opus, Sonnet, Haiku) y por qué a veces eliges uno u otro; objetivo: entender que hay modelos distintos según la tarea (se profundiza en N4).
- L4 (exercise) Tu primera cuenta y tu primer mensaje; objetivo: abrir Claude y pedirle algo cotidiano.
- L5 (quiz) Repaso: qué es y qué no es Claude.

**M2. Hablar con Claude**
- L1 (article) La conversación como interfaz: escribes, responde, sigues; objetivo: entender que el hilo guarda el contexto de la charla.
- L2 (article) Qué puede hacer ya en el chat (escribir, resumir, explicar, generar y ejecutar código sencillo, crear archivos); objetivo: conocer el abanico básico.
- L3 (exercise) Reescribe un correo tuyo en tres tonos distintos; objetivo: ver el valor de pedir variantes.
- L4 (article) Adjuntar archivos e imágenes; objetivo: saber que puedes subir un PDF o una foto y preguntar por su contenido.
- L5 (exercise) Sube un documento y pídele un resumen de 5 puntos; objetivo: tu primer trabajo sobre material propio.

**M3. Honestidad y límites**
- L1 (article) Lo que Claude NO hace bien (alucinaciones, fecha de corte, no es un profesional); objetivo: desconfiar con criterio.
- L2 (article) Cómo verificar: pedir fuentes, contrastar lo importante, usar la web para lo reciente; objetivo: incorporar la verificación como hábito.
- L3 (article) Privacidad, buen uso y memoria entre conversaciones; objetivo: saber qué compartir y cómo ver/borrar lo que Claude recuerda.
- L4 (milestone) **Hito:** mantén una conversación útil de principio a fin sobre una tarea real tuya y anota qué funcionó y qué no.

### Curso 0.2 · Tu primera conversación útil (3 módulos)

**M1. Escribir y comunicar**
- L1 (article) Redactar y reescribir (correos, mensajes, publicaciones); ajustar tono y longitud; objetivo: usar Claude como ayudante de escritura.
- L2 (exercise) Convierte unas notas desordenadas en un email claro; objetivo: del borrador al texto listo.
- L3 (article) Resumir y explicar (textos largos, conceptos difíciles "en sencillo"); objetivo: usar Claude para entender más rápido.
- L4 (exercise) Pega un texto largo y pide resumen + 3 preguntas que te hagan pensar; objetivo: leer mejor con ayuda.

**M2. El día a día**
- L1 (article) Planificar y organizar (listas, planes, comparativas, decisiones); objetivo: apoyarte en Claude para ordenar tareas.
- L2 (exercise) Pídele un plan semanal con su lista de la compra; objetivo: un resultado accionable, no solo texto.
- L3 (article) Buscar en la web desde el chat (cuándo activarlo, por qué cita fuentes); objetivo: distinguir lo que sabe de memoria de lo que busca.
- L4 (exercise) Pregunta algo de actualidad con búsqueda web y revisa las fuentes; objetivo: comprobar antes de fiarte.

**M3. Mejorar tus resultados**
- L1 (article) Si la respuesta no te sirve, díselo (pedir cambios, dar ejemplos, acotar); objetivo: entender que iterar es normal.
- L2 (article) Dar contexto básico (quién eres, para qué es, qué formato quieres); objetivo: la semilla de "el arte de pedir" (N1).
- L3 (exercise) Coge una respuesta floja y mejórala en tres turnos dando contexto; objetivo: notar el salto de calidad.
- L4 (milestone) **Hito de salida N0:** resuelve una tarea tuya real (un trámite, un texto, una decisión) usando contexto + iteración, y registra el antes/después.

---

## 7. Nivel 1 — Conversar con criterio

> Anclaje: páginas de ayuda (búsqueda web, Research, Proyectos, personalización,
> RAG) y la guía oficial de prompting para las bases de "pedir bien" (§13 A, B).

### Curso 1.1 · El arte de pedir (3 módulos)

**M1. Claridad y contexto**
- L1 (article) Sé claro y directo (di qué quieres y para qué); objetivo: la base de todo buen prompt.
- L2 (article) Da contexto (rol, audiencia, objetivo, restricciones); objetivo: que Claude responda a tu caso, no en abstracto.
- L3 (exercise) Reescribe una petición vaga en una clara con contexto; objetivo: ver el efecto del contexto.
- L4 (article) Pide el formato que necesitas (listas, tablas, pasos, longitud); objetivo: obtener salidas usables.

**M2. Ejemplos e iteración**
- L1 (article) Enséñale con ejemplos (few-shot); objetivo: mostrar 1–3 ejemplos del resultado que quieres.
- L2 (exercise) Dale dos ejemplos de "buen resumen" y pídele el tercero igual; objetivo: comprobar que copia el patrón.
- L3 (article) Iterar con criterio (corregir, acotar, pedir alternativas); objetivo: no conformarte con el primer intento.
- L4 (quiz) ¿Qué falla en este prompt? (diagnóstico).

**M3. Pensar en voz alta**
- L1 (article) Deja que Claude piense paso a paso (cadena de pensamiento) para tareas con razonamiento; objetivo: saber cuándo pedirlo.
- L2 (exercise) Pídele que razone antes de responder un problema de varios pasos; objetivo: ver cómo mejora la respuesta.
- L3 (milestone) **Hito:** consigue una respuesta excelente a una tarea tuya combinando contexto + ejemplo + iteración.

### Curso 1.2 · Trabajar con tus materiales (3 módulos)

**M1. Documentos y datos**
- L1 (article) Subir y trabajar con archivos (PDFs, imágenes, hojas, texto); objetivo: traer tu material al chat.
- L2 (exercise) Sube un PDF largo y extrae puntos clave + una tabla; objetivo: convertir un documento en algo accionable.
- L3 (article) Trabajar con datos sencillos (cálculos, gráficos, archivos de vuelta); objetivo: pedir resultados, no solo texto.

**M2. La web y la actualidad**
- L1 (article) Búsqueda web vs. Investigación (Research): cuándo usar cada una; objetivo: elegir la herramienta según la profundidad.
- L2 (exercise) Lanza una Investigación sobre un tema y revisa el informe + fuentes; objetivo: ver el valor (y el coste de tiempo) del modo profundo.

**M3. Proyectos**
- L1 (article) Qué es un Proyecto (conocimiento persistente + instrucciones propias); objetivo: entender cuándo merece la pena.
- L2 (exercise) Crea un Proyecto con tus documentos e instrucciones y trabaja dentro; objetivo: montar tu primer espacio de trabajo.
- L3 (milestone) **Hito:** monta un Proyecto para algo tuyo recurrente y resuelve dos tareas dentro de él.

### Curso 1.3 · Hacer tuyo a Claude (3 módulos)

**M1. Personalización**
- L1 (article) Memoria e instrucciones personales; objetivo: que Claude recuerde tu contexto y tus preferencias.
- L2 (exercise) Configura tus preferencias y comprueba cómo cambian las respuestas; objetivo: notar el efecto.

**M2. Elegir bien**
- L1 (article) Elegir modelo y modo (rápido vs. profundo; pensamiento extendido); objetivo: saber cuándo subir o bajar el esfuerzo.
- L2 (article) Conectar herramientas (vistazo): los conectores te enlazan con tus apps vía MCP; objetivo: abrir la puerta a N3.

**M3. Cierre de nivel**
- L1 (milestone) **Hito de nivel N1:** resuelve un encargo realista (varios pasos, tus materiales, web y un Proyecto) y documenta tu proceso.

---

## 8. Nivel 2 — El oficio del prompt (módulos)

> Anclaje: la **guía oficial de prompt engineering** y la pieza de ingeniería de
> contexto (§13 B, E).

- **2.1 Estructura y claridad:** instrucciones claras y directas · roles y system
  prompts · pedir el formato de salida · plantillas y variables de prompt.
- **2.2 Ejemplos y razonamiento:** multishot/few-shot · cadena de pensamiento
  (básica, guiada, estructurada) · etiquetas XML para estructurar el prompt.
- **2.3 Encadenar y controlar:** dividir tareas en cadenas de prompts · forzar
  formato y acotar la salida · controlar longitud y tono · reducir alucinaciones.
- **2.4 Contexto largo y fiabilidad:** trabajar con mucho contexto · nociones de
  ingeniería de contexto · comparar prompts (evals informales: probar el mismo
  prompt en varios casos) · el generador/mejorador de prompts de la Consola.
- **Hito de salida N2:** convierte una tarea recurrente en un prompt fiable y
  reutilizable, probado en varios casos distintos.

---

## 9. Nivel 3 — Claude que actúa (módulos)

> Anclaje: páginas de ayuda y blog de Proyectos, Artefactos, conectores/MCP,
> Desktop Extensions, Skills, Research y Claude Code en planes de pago (§13 A, C).

- **3.1 Proyectos y artefactos:** Proyectos a fondo (conocimiento, RAG en planes
  de pago, instrucciones) · Artefactos: crear apps y herramientas sin escribir
  código · artefactos con IA y cómo compartirlos.
- **3.2 Conectar Claude a tus herramientas:** conectores y el Model Context
  Protocol (MCP) · conectores remotos vs. locales (Desktop Extensions) · el
  directorio de conectores · permisos y seguridad al conectar tus datos.
- **3.3 Habilidades (Skills):** qué son las Skills y en qué se diferencian de un
  prompt, un Proyecto, un conector MCP o un subagente · usar Skills en Claude ·
  crear tu primera Skill.
- **3.4 Investigación y automatización ligera:** la Investigación (Research)
  multi-fuente · cuándo dejar que Claude actúe por su cuenta · primer vistazo a
  **Claude Code** desde tu plan Pro/Max.
- **Hito de salida N3:** automatiza un flujo real combinando un Proyecto, un
  conector o una Skill y un artefacto, y enséñaselo a alguien.

---

## 10. Nivel 4 — Construir con la API (módulos)

> Anclaje: la **documentación de la API / Plataforma para desarrolladores**
> (modelos, Mensajes, streaming, visión/PDF, tool use, salidas estructuradas,
> caching, batches, tokens, errores) (§13 D).

- **4.1 Primeros pasos con la API:** la Consola y las claves · el endpoint de
  Mensajes (`/v1/messages`) · SDKs oficiales (Python, TypeScript y más) y la CLI
  `ant` · tu primera llamada.
- **4.2 Mensajes a fondo:** `system` / `user` / `assistant` · modelos y precios
  (familias Opus, Sonnet, Haiku; el más capaz, Claude Fable 5) · `max_tokens` y
  streaming · visión y PDFs · conteo de tokens.
- **4.3 Herramientas (tool use):** definir herramientas propias · el bucle de
  herramientas · herramientas de servidor (ejecución de código, búsqueda/lectura
  web) · salidas estructuradas (`output_config.format`).
- **4.4 Calidad, coste y fiabilidad:** pensamiento adaptativo y `effort` · prompt
  caching · procesamiento por lotes (Batches) · manejo de errores y reintentos.
- **Hito de salida N4:** construye una pequeña app con la API (entrada → llamada
  → salida útil) con al menos una herramienta y manejo de errores.

---

## 11. Nivel 5 — Sistemas agénticos en producción (módulos)

> Anclaje: el **Claude Agent SDK**, **Managed Agents**, MCP, diseño de agentes e
> ingeniería de contexto, y las piezas de ingeniería de Anthropic (§13 C, D, E).

- **5.1 Diseñar un agente:** cuándo (y cuándo NO) construir un agente · diseño de
  la superficie de herramientas (bash vs. herramientas dedicadas) · gestión de
  contexto (compaction, context editing, memoria).
- **5.2 El Claude Agent SDK:** el bucle de agente que mueve a Claude Code, ahora
  programable (Python/TypeScript) · herramientas integradas, permisos y
  subagentes · construir un agente de tareas.
- **5.3 MCP a fondo:** el Model Context Protocol como estándar abierto · usar
  servidores MCP de terceros y construir el tuyo · credenciales y permisos.
- **5.4 Agentes gestionados (Managed Agents):** agentes con estado alojados por
  Anthropic · sesiones, entornos y contenedores · resultados (Outcomes) con
  rúbrica, multiagente y despliegues programados (beta; verificar disponibilidad).
- **5.5 Evaluar, observar y operar:** diseño de evals y rúbricas · observabilidad
  y coste · seguridad, límites y rechazos · iterar en producción.
- **Hito final N5:** lleva un agente de extremo a extremo a un entorno real, con
  su batería de evals y su plan de operación.

---

## 12. Catálogo de habilidades (seed de la tabla `techniques`)

Equivalente a la tabla de técnicas de la plataforma base: habilidades concretas
de uso de Claude, con su nivel y un estado de dominio propio (independiente de
las lecciones que las enseñan). Crece desde el admin. Categorías: `conversation`,
`prompting`, `tools`, `api`, `agents`, `theory`.

| slug | Nombre | Categoría | Nivel |
|---|---|---|---|
| dar-contexto | Dar contexto | conversation | 0 |
| subir-archivos | Subir archivos e imágenes | conversation | 0 |
| iterar | Iterar y pedir cambios | conversation | 1 |
| pedir-formato | Pedir el formato de salida | conversation | 1 |
| buscar-en-web | Usar la búsqueda web | conversation | 1 |
| usar-research | Usar Investigación (Research) | conversation | 1 |
| trabajar-datos | Trabajar con datos y archivos de vuelta | conversation | 1 |
| usar-proyectos | Usar Proyectos | tools | 1 |
| personalizar | Memoria e instrucciones personales | conversation | 1 |
| elegir-modelo | Elegir modelo y modo | conversation | 1 |
| verificar-respuestas | Verificar respuestas | theory | 1 |
| ser-claro-directo | Ser claro y directo | prompting | 2 |
| few-shot | Ejemplos (few-shot/multishot) | prompting | 2 |
| cadena-de-pensamiento | Cadena de pensamiento | prompting | 2 |
| xml-tags | Estructurar con etiquetas XML | prompting | 2 |
| system-prompts | Roles y system prompts | prompting | 2 |
| plantillas-prompt | Plantillas y variables de prompt | prompting | 2 |
| encadenar-prompts | Encadenar prompts | prompting | 2 |
| contexto-largo | Manejar contexto largo | prompting | 2 |
| reducir-alucinaciones | Reducir alucinaciones | theory | 2 |
| artefactos | Crear artefactos (apps sin código) | tools | 3 |
| conectores-mcp | Conectores y MCP en la app | tools | 3 |
| skills-en-claude | Habilidades (Skills) en Claude | tools | 3 |
| claude-code | Claude Code (primeros pasos) | tools | 3 |
| consola-api | Consola y claves de API | api | 4 |
| mensajes-api | La API de Mensajes | api | 4 |
| streaming | Streaming de respuestas | api | 4 |
| vision-pdf | Visión y PDFs por API | api | 4 |
| tool-use | Tool use (herramientas) | api | 4 |
| salidas-estructuradas | Salidas estructuradas | api | 4 |
| pensamiento-effort | Pensamiento adaptativo y effort | api | 4 |
| prompt-caching | Prompt caching | api | 4 |
| batches | Procesamiento por lotes | api | 4 |
| conteo-tokens | Conteo de tokens | api | 4 |
| diseno-agentes | Diseño de agentes | agents | 5 |
| agent-sdk | Claude Agent SDK | agents | 5 |
| construir-mcp | Construir servidores MCP | agents | 5 |
| managed-agents | Managed Agents | agents | 5 |
| contexto-agentes | Gestión de contexto en agentes | agents | 5 |
| diseno-evals | Diseño de evals | agents | 5 |
| observabilidad | Observabilidad y operación | agents | 5 |

(El nivel marca dónde se introduce; por la espiral, muchas reaparecen más hondas
en niveles superiores. La lista crecerá desde el admin.)

---

## 13. Fuentes oficiales consultadas

Consultadas el 2026-06-17. Anthropic publica en varios dominios oficiales
(`claude.com`, `support.claude.com` = Centro de ayuda, `docs.claude.com` /
`platform.claude.com/docs` = doc de desarrollador, `code.claude.com/docs` =
Claude Code, `anthropic.com` = blog e ingeniería). Las explicaciones de las
lecciones se redactan **propias** y citan y enlazan estas fuentes; no se copian.

**A · Producto y planes (N0–N1, N3)**
- [Plans & Pricing](https://claude.com/pricing) · [Download Claude](https://claude.com/download)
- [What is the Pro plan?](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan) · [What is the Max plan?](https://support.claude.com/en/articles/11049741-what-is-the-max-plan)
- [Understanding Claude's personalization features](https://support.claude.com/en/articles/10185728-understanding-claude-s-personalization-features)
- [Enable and use web search](https://support.claude.com/en/articles/10684626-enable-and-use-web-search) · [When to use web search, extended thinking, and research](https://support.claude.com/en/articles/11095361-when-should-i-use-web-search-extended-thinking-and-research) · [Use research on Claude](https://support.claude.com/en/articles/11088861-use-research-on-claude)
- [What are projects?](https://support.claude.com/en/articles/9517075-what-are-projects) · [Create and manage projects](https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects) · [RAG for projects](https://support.claude.com/en/articles/11473015-retrieval-augmented-generation-rag-for-projects)

**B · Prompting (N1–N2)**
- [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [Use XML tags to structure your prompts](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags)
- [Let Claude think (chain of thought)](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/chain-of-thought)
- [Generate better prompts (prompt generator)](https://www.anthropic.com/news/prompt-generator)

**C · Acción: Artefactos, conectores/MCP, Skills, Claude Code (N3, N5)**
- [What are artifacts and how do I use them?](https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them) · [Use artifacts to build AI apps](https://support.claude.com/en/articles/11649427-use-artifacts-to-visualize-and-create-ai-apps-without-ever-writing-a-line-of-code)
- [Use connectors to extend Claude](https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities) · [Custom connectors using remote MCP](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp) · [Local MCP servers on Claude Desktop](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop) · [Desktop Extensions](https://www.anthropic.com/engineering/desktop-extensions)
- [What are skills?](https://support.claude.com/en/articles/12512176-what-are-skills) · [Use skills in Claude](https://support.claude.com/en/articles/12512180-use-skills-in-claude) · [Skills explained](https://claude.com/blog/skills-explained)
- [Use Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) · [Claude Code docs](https://code.claude.com/docs)

**D · API / Plataforma para desarrolladores (N4–N5)**
- [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview) · [Pricing](https://platform.claude.com/docs/en/pricing)
- [Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) · [Streaming](https://platform.claude.com/docs/en/build-with-claude/streaming) · [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) · [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) · [Token counting](https://platform.claude.com/docs/en/build-with-claude/token-counting) · [Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing) · [Vision](https://platform.claude.com/docs/en/build-with-claude/vision) · [PDF support](https://platform.claude.com/docs/en/build-with-claude/pdf-support)
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking) · [Effort](https://platform.claude.com/docs/en/build-with-claude/effort)
- [Web search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) · [Code execution tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool)

**E · Agentes (N5)**
- [Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) · [Building agents with the Claude Agent SDK](https://claude.com/blog/building-agents-with-the-claude-agent-sdk)
- [Managed Agents — Get started](https://platform.claude.com/docs/en/managed-agents/quickstart) · [Define outcomes](https://platform.claude.com/docs/en/managed-agents/define-outcomes)
- [MCP connector](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector) · [Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) · [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)

> **Marcas y verificación.** Nombres de modelos (p. ej. *Claude Fable 5*, *Opus
> 4.8*) y funciones (Research, Skills, Managed Agents) están tomados de la doc
> oficial vigente a la fecha de arriba. Algunas funciones están en **beta** o
> cambian de nombre/alcance entre versiones; en la redacción de cada lección se
> **re-verifica contra la fuente** antes de publicar, y se marca lo incierto.

---

## 14. Derechos, anclaje y actualización del contenido

- **Explicaciones propias, ancladas en doc oficial.** Las lecciones se redactan
  con palabras propias a partir de la documentación oficial de Anthropic; se
  **cita y enlaza** la fuente, nunca se copia ni se reproduce su texto.
- **Marcas y capturas de terceros.** "Claude", "Anthropic" y los nombres de
  funciones son marcas de Anthropic; se usan de forma nominativa para enseñar a
  usar el producto. Las capturas, si se usan, son ilustrativas y se sustituyen
  por material propio cuando aporta.
- **Fechado y verificable.** Cada documento y, más adelante, cada lección llevan
  fecha de revisión. Lo que no esté en doc oficial no entra; lo incierto se
  marca.
- **Mantenimiento previsto.** Claude evoluciona rápido (modelos, funciones,
  precios). El currículo se revisa por ese ritmo: al menos en cada cambio
  relevante de modelo o de funciones de la app/API se repasan los niveles
  afectados y se re-verifican las fuentes.
