-- CS-T5: renombrado NO destructivo del enum technique_category a las
-- categorías reales de Claude (docs/02 §12). ALTER TYPE ... RENAME VALUE
-- conserva los datos: las filas mantienen su categoría, solo cambia la
-- etiqueta del literal (drizzle-kit generaba un drop/recreate que habría
-- fallado al castear 'cards'/'coins'/... al tipo nuevo).
--
-- Mapeo posicional heredado de CS-T3 (1:1, sin huérfanos ni altas):
--   cards -> conversation · coins -> prompting · mentalism -> tools ·
--   classics -> api · stage -> agents · theory (sin cambio).
ALTER TYPE "public"."technique_category" RENAME VALUE 'cards' TO 'conversation';--> statement-breakpoint
ALTER TYPE "public"."technique_category" RENAME VALUE 'coins' TO 'prompting';--> statement-breakpoint
ALTER TYPE "public"."technique_category" RENAME VALUE 'mentalism' TO 'tools';--> statement-breakpoint
ALTER TYPE "public"."technique_category" RENAME VALUE 'classics' TO 'api';--> statement-breakpoint
ALTER TYPE "public"."technique_category" RENAME VALUE 'stage' TO 'agents';
