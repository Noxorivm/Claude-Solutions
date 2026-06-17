import { describe, expect, it } from "vitest";

import { parseVideoUrl } from "@/lib/video";

describe("parseVideoUrl", () => {
  it("youtube watch?v= → youtube-nocookie embed", () => {
    expect(
      parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s"),
    ).toEqual({
      provider: "youtube",
      videoId: "dQw4w9WgXcQ",
      embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    });
  });

  it("youtu.be corto", () => {
    expect(parseVideoUrl("https://youtu.be/dQw4w9WgXcQ")).toMatchObject({
      provider: "youtube",
      embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    });
  });

  it("youtube /shorts/", () => {
    expect(
      parseVideoUrl("https://www.youtube.com/shorts/abc123XYZ_-"),
    ).toMatchObject({
      provider: "youtube",
      embedUrl: "https://www.youtube-nocookie.com/embed/abc123XYZ_-",
    });
  });

  it("vimeo → player.vimeo.com", () => {
    expect(parseVideoUrl("https://vimeo.com/76979871")).toEqual({
      provider: "vimeo",
      videoId: "76979871",
      embedUrl: "https://player.vimeo.com/video/76979871",
    });
  });

  it("mp4 directo → file", () => {
    expect(
      parseVideoUrl("https://cdn.claude-solutions.dev/lecciones/doble-volteo.MP4"),
    ).toEqual({
      provider: "file",
      embedUrl: "https://cdn.claude-solutions.dev/lecciones/doble-volteo.MP4",
    });
  });

  it("otros formatos de archivo de vídeo → file", () => {
    expect(parseVideoUrl("https://example.com/v/clase.webm")).toMatchObject({
      provider: "file",
    });
  });

  it("URL inválida → null", () => {
    expect(parseVideoUrl("no es una url")).toBeNull();
    expect(parseVideoUrl("ftp://example.com/video.mp4")).toBeNull();
  });

  it("vacía o nula → null", () => {
    expect(parseVideoUrl("")).toBeNull();
    expect(parseVideoUrl("   ")).toBeNull();
    expect(parseVideoUrl(null)).toBeNull();
    expect(parseVideoUrl(undefined)).toBeNull();
  });

  it("URL https que no es vídeo → null", () => {
    expect(parseVideoUrl("https://example.com/articulo")).toBeNull();
    expect(parseVideoUrl("https://www.youtube.com/watch")).toBeNull();
  });
});
