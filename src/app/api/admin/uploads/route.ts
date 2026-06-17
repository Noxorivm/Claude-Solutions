import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { uploads } from "@/db/schema";
import { auth } from "@/lib/auth";
import { strings } from "@/lib/strings";
import { uploadsDir } from "@/lib/uploads";

const MAX_BYTES = 5 * 1024 * 1024;

// Lista blanca de MIME (docs/04 §Patrones 7) con su extensión canónica
// y las extensiones de nombre de archivo aceptadas.
const ALLOWED: Record<string, { ext: string; nameExts: string[] }> = {
  "image/png": { ext: ".png", nameExts: [".png"] },
  "image/jpeg": { ext: ".jpg", nameExts: [".jpg", ".jpeg"] },
  "image/webp": { ext: ".webp", nameExts: [".webp"] },
  "image/gif": { ext: ".gif", nameExts: [".gif"] },
};

/** Firma binaria coherente con el MIME declarado: caza renombrados. */
function matchesSignature(mime: string, buffer: Buffer): boolean {
  if (buffer.length < 12) {
    return false;
  }
  switch (mime) {
    case "image/png":
      return buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/jpeg":
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "image/gif":
      return (
        buffer.subarray(0, 6).toString("ascii") === "GIF87a" ||
        buffer.subarray(0, 6).toString("ascii") === "GIF89a"
      );
    case "image/webp":
      return (
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
      );
    default:
      return false;
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Solo admin." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: strings.admin.uploads.missingFile },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: strings.admin.uploads.tooBig },
      { status: 413 },
    );
  }

  const allowed = ALLOWED[file.type];
  if (!allowed) {
    return NextResponse.json(
      { error: strings.admin.uploads.badType },
      { status: 415 },
    );
  }
  const nameExt = path.extname(file.name).toLowerCase();
  if (!allowed.nameExts.includes(nameExt)) {
    return NextResponse.json(
      { error: strings.admin.uploads.extMismatch },
      { status: 415 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(file.type, buffer)) {
    return NextResponse.json(
      { error: strings.admin.uploads.badContent },
      { status: 415 },
    );
  }

  // Nombre = hash del contenido: dedupe natural y URLs inmutables.
  const hash = createHash("sha256").update(buffer).digest("hex");
  const fileName = `${hash}${allowed.ext}`;
  const dir = uploadsDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), buffer);

  await db
    .insert(uploads)
    .values({
      path: fileName,
      mime: file.type,
      sizeBytes: file.size,
      createdBy: session.user.id,
    })
    .onConflictDoNothing({ target: uploads.path });

  return NextResponse.json({ url: `/uploads/${fileName}` });
}
