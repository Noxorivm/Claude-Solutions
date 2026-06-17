# 02 · Currículo — Claude Solutions

> **Stub (CS-T1).** El currículo arranca **en blanco**: existen los 6 niveles
> con nombre y tagline, pero **sin cursos, módulos ni lecciones**. El temario
> completo de Claude Solutions (cursos y lecciones, remapeo de conceptos al
> dominio de Claude, simulador) se redacta en una tarea posterior. Este
> documento se reescribirá entonces como fuente de verdad del contenido y del
> **seed**.

## Niveles (N0–N5)

La progresión va de principiante a experto en el uso de Claude. Los nombres y
taglines viven también en el seed (`src/db/seed/curriculum.ts`, fuente de
verdad técnica mientras este doc es un stub).

| Nivel | Nombre | Tagline |
|---|---|---|
| N0 | **Primeros pasos** | Qué es Claude, cómo hablarle y tus primeras conversaciones útiles. |
| N1 | **Conversar con criterio** | Dar contexto, iterar y pedir lo que de verdad necesitas. |
| N2 | **El oficio del prompt** | Estructura, ejemplos y patrones para prompts fiables. |
| N3 | **Claude que actúa** | Proyectos, archivos, artefactos y herramientas conectadas. |
| N4 | **Construir con la API** | Mensajes, streaming y uso de herramientas desde la API. |
| N5 | **Sistemas agénticos en producción** | Agentes, MCP, orquestación y despliegue real. |

## Mecánica del seed (intacta)

El motor del seed se conserva de Cubiletica: upsert idempotente de niveles por
`id`, catálogo de **técnicas** (vacío por ahora), **quizzes** (vacíos) y
**logros** genéricos; el admin inicial se crea desde variables de entorno
(`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`). Poblar cursos/lecciones se hará
desde el panel admin o ampliando `curriculum.ts`.
