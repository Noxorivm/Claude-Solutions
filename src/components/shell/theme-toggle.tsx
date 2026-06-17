"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { strings } from "@/lib/strings";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  // El tema resuelto solo se conoce en cliente: placeholder del mismo
  // tamaño hasta montar para no provocar mismatch de hidratación.
  if (!mounted) {
    return <span aria-hidden className="size-11" />;
  }

  const isDark = resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11"
      aria-label={isDark ? strings.shell.toLight : strings.shell.toDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Sun className="size-5" strokeWidth={1.75} aria-hidden />
      ) : (
        <Moon className="size-5" strokeWidth={1.75} aria-hidden />
      )}
    </Button>
  );
}
