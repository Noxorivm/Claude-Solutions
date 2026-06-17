import { cn } from "@/lib/utils";

// Icono propio de racha (docs/06 §Componentes): cerilla encendida en
// lugar del Flame genérico de Lucide. Mismo lenguaje visual: viewBox 24,
// trazo 1.75, esquinas redondeadas, currentColor.
export function StreakFlameIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
      aria-hidden="true"
    >
      {/* palo de la cerilla */}
      <path d="M12 14.5V21" />
      {/* cabeza incandescente */}
      <circle cx="12" cy="13" r="1.5" />
      {/* llama */}
      <path d="M12 11.5c-2.1-.4-3.5-2-3.5-4 0-1.6 1.2-2.9 2-4.5.4.9 1 1.4 1.5 2 .9 1 2 2.1 2 3.5a3.5 3.5 0 0 1-2 3Z" />
    </svg>
  );
}
