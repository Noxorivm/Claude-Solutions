// Aplica el contenido redactado en content/courses/**/*.md a
// lessons.content_md por slug (Fase C). Seguro y repetible: solo pisa
// lecciones cuyo contenido actual contiene "[REDACTAR]" (o está vacío);
// con --force sobrescribe también las editadas (p. ej. por el admin).
// Uso: pnpm content:apply [--force]
import "dotenv/config";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { lessons } from "../src/db/schema";

const CONTENT_DIR = path.resolve(process.cwd(), "content", "courses");

interface ContentFile {
  file: string;
  slug: string;
  body: string;
}

/** Frontmatter mínimo: bloque --- inicial con `slug: ...`. */
function parseContentFile(file: string, raw: string): ContentFile {
  const normalized = raw.replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n/.exec(normalized);
  if (!match) {
    throw new Error(`${file}: falta el frontmatter (--- slug: ... ---)`);
  }
  const slugLine = match[1]
    .split("\n")
    .find((line) => line.startsWith("slug:"));
  if (!slugLine) {
    throw new Error(`${file}: el frontmatter no tiene slug`);
  }
  const slug = slugLine.slice("slug:".length).trim();
  const body = normalized.slice(match[0].length).trim();
  if (body.length === 0) {
    throw new Error(`${file}: el cuerpo está vacío`);
  }
  return { file, slug, body };
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[content] DATABASE_URL no está definida");
    process.exit(1);
  }
  const force = process.argv.includes("--force");
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  const courseDirs = await readdir(CONTENT_DIR, { withFileTypes: true });
  const files: ContentFile[] = [];
  for (const dir of courseDirs) {
    if (!dir.isDirectory()) continue;
    const dirPath = path.join(CONTENT_DIR, dir.name);
    for (const name of await readdir(dirPath)) {
      if (!name.endsWith(".md")) continue;
      files.push(
        parseContentFile(
          `${dir.name}/${name}`,
          await readFile(path.join(dirPath, name), "utf8"),
        ),
      );
    }
  }
  files.sort((a, b) => a.slug.localeCompare(b.slug));

  let applied = 0;
  let skipped = 0;
  let missing = 0;
  for (const { file, slug, body } of files) {
    const rows = await db
      .select({ id: lessons.id, contentMd: lessons.contentMd })
      .from(lessons)
      .where(eq(lessons.slug, slug))
      .limit(1);
    const lesson = rows[0];
    if (!lesson) {
      missing++;
      console.log(`[content] SIN-MATCH ${file} (slug ${slug})`);
      continue;
    }
    const editable =
      lesson.contentMd === null || lesson.contentMd.includes("[REDACTAR]");
    if (!editable && !force) {
      skipped++;
      console.log(`[content] saltada   ${slug} (editada; usa --force)`);
      continue;
    }
    await db
      .update(lessons)
      .set({ contentMd: body })
      .where(eq(lessons.id, lesson.id));
    applied++;
    console.log(`[content] aplicada  ${slug}`);
  }

  console.log(
    `[content] resumen: ${applied} aplicadas · ${skipped} saltadas · ${missing} sin-match`,
  );
  await client.end();
  process.exit(missing > 0 ? 1 : 0);
}

main().catch(async (error: unknown) => {
  console.error(
    "[content] ERROR:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
