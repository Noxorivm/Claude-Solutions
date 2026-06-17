// Parser de URL de vídeo → proveedor + URL de embed (docs/04 §Stack:
// embeds youtube-nocookie/vimeo con facade, <video> para MP4 propios).
// Puro y sin IO; usado por VideoEmbed y, en F5, por el editor del admin
// para derivar lessons.video_provider al guardar.

export type VideoProvider = "youtube" | "vimeo" | "file";

export interface ParsedVideo {
  provider: VideoProvider;
  embedUrl: string;
  /** Id del vídeo (youtube/vimeo), útil para miniaturas. */
  videoId?: string;
}

const FILE_EXTENSIONS = [".mp4", ".webm", ".m4v", ".mov", ".ogv"];

function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id || null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") {
      return url.searchParams.get("v");
    }
    const shorts = /^\/(?:shorts|embed)\/([^/?]+)/.exec(url.pathname);
    if (shorts) {
      return shorts[1];
    }
  }
  return null;
}

function vimeoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "vimeo.com" && host !== "player.vimeo.com") {
    return null;
  }
  const match = /\/(?:video\/)?(\d+)/.exec(url.pathname);
  return match ? match[1] : null;
}

export function parseVideoUrl(
  rawUrl: string | null | undefined,
): ParsedVideo | null {
  if (!rawUrl || rawUrl.trim() === "") {
    return null;
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return null;
  }

  const ytId = youtubeId(url);
  if (ytId) {
    return {
      provider: "youtube",
      videoId: ytId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}`,
    };
  }

  const vId = vimeoId(url);
  if (vId) {
    return {
      provider: "vimeo",
      videoId: vId,
      embedUrl: `https://player.vimeo.com/video/${vId}`,
    };
  }

  const pathname = url.pathname.toLowerCase();
  if (FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return { provider: "file", embedUrl: url.toString() };
  }

  return null;
}
