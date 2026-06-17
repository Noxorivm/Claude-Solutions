import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// Glyph line-art propio (R2b-1): un naipe con chispa, en el lenguaje de
// StreakFlameIcon (viewBox 24, trazo 1.75, currentColor). Sin assets de
// terceros.
function ArcanaGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* naipe */}
      <rect x="6" y="3.5" width="12" height="17" rx="2" />
      {/* chispa central de cuatro puntas */}
      <path d="M12 8.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5L8.5 12l2.5-1Z" />
    </svg>
  );
}

// Estado vacío honesto y armonizado (docs/06 §Componentes, §microcopy):
// medallón hexagonal con glyph propio + eyebrow + mensaje, sobre marco
// sutil y veladura. Decorativo salvo el texto; `role` opcional para los
// casos que deben anunciarse (p. ej. quiz sin preguntas, status).
export function EmptyState({
  eyebrow,
  message,
  icon,
  role,
  className,
}: {
  eyebrow: string;
  message: string;
  icon?: ReactNode;
  role?: "status";
  className?: string;
}) {
  return (
    <div
      role={role}
      className={cn(
        "ornate-frame-sutil felt-texture flex flex-col items-center gap-3 p-8 text-center",
        className,
      )}
    >
      <span className="hex-medallion" aria-hidden>
        {icon ?? <ArcanaGlyph className="size-5 text-primary" />}
      </span>
      <p className="heading-eyebrow">{eyebrow}</p>
      <p className="max-w-prose text-[15px] text-muted-foreground">{message}</p>
    </div>
  );
}
