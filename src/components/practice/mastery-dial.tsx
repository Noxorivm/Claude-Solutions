import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

// Dial de dominio 0–5 (docs/06 §Componentes): cinco segmentos, Latón
// hasta el nivel actual. El valor viaja como texto accesible.
export function MasteryDial({
  mastery,
  size = "lg",
}: {
  mastery: number;
  size?: "lg" | "sm";
}) {
  const dim = size === "lg" ? 96 : 32;
  const stroke = size === "lg" ? 8 : 4;
  const radius = (dim - stroke) / 2;
  const center = dim / 2;
  const gap = size === "lg" ? 5 : 9;
  // Dominio pleno (5) en success-ink «tapete»; el resto en oro (R2b-2).
  const fillClass = mastery >= 5 ? "stroke-success-ink" : "stroke-primary";
  const label = `${strings.techniques.masteryOf(mastery)}: ${strings.techniques.masteryDescriptors[mastery]}`;

  return (
    <span
      role="img"
      aria-label={label}
      className="inline-grid place-items-center"
      style={{ width: dim, height: dim }}
    >
      <svg
        viewBox={`0 0 ${dim} ${dim}`}
        width={dim}
        height={dim}
        aria-hidden
        className="col-start-1 row-start-1"
      >
        {[0, 1, 2, 3, 4].map((segment) => (
          <path
            key={segment}
            d={arcPath(
              center,
              center,
              radius,
              segment * 72 + gap,
              (segment + 1) * 72 - gap,
            )}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            className={mastery > segment ? fillClass : "stroke-border"}
          />
        ))}
      </svg>
      <span
        aria-hidden
        className={cn(
          "col-start-1 row-start-1 font-mono leading-none",
          size === "lg" ? "text-3xl" : "text-[12px]",
        )}
      >
        {mastery}
      </span>
    </span>
  );
}
