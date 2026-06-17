import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Imagen Docker de producción (docs/04 §Despliegue): server.js
  // autocontenido + node_modules mínimos en .next/standalone.
  output: "standalone",
  images: {
    // Miniaturas del facade de vídeo (docs/03 §C1).
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com" }],
  },
};

export default nextConfig;
