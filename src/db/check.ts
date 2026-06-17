import "dotenv/config";

import { sql } from "drizzle-orm";

import { client, db } from "./index";

function redactPassword(url: string): string {
  return url.replace(/\/\/([^:@/]+):[^@]+@/, "//$1:***@");
}

async function main(): Promise<void> {
  const target = redactPassword(process.env.DATABASE_URL ?? "");
  try {
    await db.execute(sql`select 1`);
    console.log(`OK: conexión a Postgres verificada (${target})`);
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error(`ERROR: no se pudo conectar a Postgres (${target})`);
    console.error(error instanceof Error ? error.message : String(error));
    console.error(
      "¿Está levantada la BD de desarrollo? docker compose -f docker-compose.dev.yml up -d",
    );
    process.exit(1);
  }
}

void main();
