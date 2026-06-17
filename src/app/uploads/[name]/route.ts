import { readFile } from "node:fs/promises";
import path from "node:path";

import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { UPLOAD_CONTENT_TYPES, uploadsDir } from "@/lib/uploads";

// Sirve subidas desde UPLOADS_DIR. Pública para cualquier sesión
// iniciada (las imágenes se ven dentro de lecciones).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { name } = await params;
  const dir = uploadsDir();
  // Anti path-traversal: resolver y verificar que sigue dentro del dir.
  const resolved = path.resolve(dir, name);
  if (!resolved.startsWith(dir + path.sep)) {
    return new NextResponse(null, { status: 404 });
  }

  const contentType =
    UPLOAD_CONTENT_TYPES[path.extname(resolved).toLowerCase()];
  if (!contentType) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const buffer = await readFile(resolved);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        // El nombre es un hash del contenido: cachear para siempre.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
