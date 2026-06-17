import type { Metadata } from "next";
import {
  Atkinson_Hyperlegible,
  Cinzel,
  Spline_Sans_Mono,
} from "next/font/google";

import "@/styles/globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

// display: "optional" (F6-T3): con swap, el repintado tardío de la
// webfont convertía el H1 en un LCP de ~7s bajo throttling. next/font
// genera fallbacks con métricas ajustadas, así que no hay salto visual
// y en visitas con caché la fuente real aparece siempre.
// R1 «Academia arcana»: Cinzel (lapidaria) sustituye a Bodoni Moda.
const displayFont = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  display: "optional",
});

const bodyFont = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "optional",
});

const monoFont = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "optional",
});

export const metadata: Metadata = {
  title: "Claude Solutions",
  description: "Plataforma de formación para aprender a usar Claude",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      {/* Extensiones del navegador inyectan atributos en body antes de
          hidratar; esto silencia solo las discrepancias de atributos del
          propio body. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
