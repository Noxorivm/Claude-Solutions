"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// attribute="class": el tema oscuro "Función" vive en :root y el claro
// "Ensayo" en .light (src/styles/globals.css). defaultTheme="dark"
// (R2a-fix, decisión del dueño): la app abre siempre en «Función»; el
// claro queda como tema secundario accesible desde el toggle, y un
// valor "system" heredado de antes cae también al oscuro.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
