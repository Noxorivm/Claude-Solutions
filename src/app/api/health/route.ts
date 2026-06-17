import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";

// Healthcheck de los contenedores (docker/docker-compose.yml): la app
// está sana si responde Y la BD contesta a un SELECT 1 dentro del
// timeout. Sin auth: no expone nada más que ok/error.
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 3000;

export async function GET() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      db.execute(sql`select 1`),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("db healthcheck timeout")),
          TIMEOUT_MS,
        );
      }),
    ]);
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  } finally {
    clearTimeout(timer);
  }
}
