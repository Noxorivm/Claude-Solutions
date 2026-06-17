import path from "node:path";

/** Directorio físico de subidas (docs/04: volumen local /data/uploads). */
export function uploadsDir(): string {
  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.UPLOADS_DIR ?? "./data/uploads",
  );
}

/** Content-Type de los archivos servidos desde /uploads. */
export const UPLOAD_CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};
