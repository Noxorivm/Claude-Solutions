"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { strings } from "@/lib/strings";
import type { ParsedVideo } from "@/lib/video";

// Facade (docs/03 §C1, docs/06 §A11y-5): nada de iframe en el DOM hasta
// el clic; miniatura para YouTube y placeholder sobre fieltro para el
// resto, con nombre accesible "Reproducir vídeo: {título}".
export function VideoEmbed({
  video,
  title,
  trackUrl,
}: {
  video: ParsedVideo;
  title: string;
  /** Subtítulos VTT para vídeos propios (provider file). */
  trackUrl?: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    if (video.provider === "file") {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-xl border bg-black">
          <video controls autoPlay className="size-full" src={video.embedUrl}>
            {trackUrl ? (
              <track
                kind="captions"
                src={trackUrl}
                srcLang="es"
                label="Español"
                default
              />
            ) : null}
          </video>
        </div>
      );
    }
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border">
        <iframe
          src={`${video.embedUrl}?autoplay=1`}
          title={title}
          className="size-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={strings.lesson.playVideo(title)}
      className="group ornate-frame-sutil felt-texture relative block aspect-video w-full overflow-hidden"
    >
      {video.provider === "youtube" && video.videoId ? (
        <Image
          src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 1036px"
          className="object-cover"
        />
      ) : null}
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105 motion-reduce:transition-none">
          <Play className="size-7" fill="currentColor" aria-hidden />
        </span>
      </span>
    </button>
  );
}
