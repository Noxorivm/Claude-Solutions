// Migrador de producción (docs/04 §Despliegue: migrate-on-start). Se
// bundlea con esbuild a docker/dist/migrate.mjs y corre en el contenedor
// ANTES de server.js: aplica las migraciones SQL de drizzle/ que falten.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate] DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(url, { max: 1 });

try {
  console.log("[migrate] applying pending migrations from ./drizzle …");
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("[migrate] migrations up to date");
  await client.end();
  process.exit(0);
} catch (error) {
  console.error(
    "[migrate] FAILED:",
    error instanceof Error ? error.message : error,
  );
  await client.end({ timeout: 1 }).catch(() => undefined);
  process.exit(1);
}
