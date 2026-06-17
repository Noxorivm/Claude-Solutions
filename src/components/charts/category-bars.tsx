import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { CategorySeconds } from "@/db/queries/progress";
import { formatHours } from "@/lib/format";
import { strings } from "@/lib/strings";

const t = strings.progress;
const CATEGORY_LABELS = strings.techniques.categories;

// Barras por categoría (docs/03 §D2): lista HTML accesible, barra CSS
// proporcional en Latón y horas en Spline Mono.
export function CategoryBars({
  categories,
  totalSeconds,
}: {
  categories: CategorySeconds[];
  totalSeconds: number;
}) {
  if (categories.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-[15px] text-muted-foreground">{t.categoriesEmpty}</p>
        <Button asChild variant="outline" className="h-11">
          <Link href="/app/practica">{strings.practice.emptyCta}</Link>
        </Button>
      </div>
    );
  }

  const max = Math.max(...categories.map((entry) => entry.seconds), 1);

  return (
    <div>
      <ul className="space-y-3">
        {categories.map((entry) => (
          <li key={entry.category} className="text-[15px]">
            <div className="flex items-baseline justify-between gap-3">
              <span>{CATEGORY_LABELS[entry.category] ?? entry.category}</span>
              <span className="font-mono text-[13px] text-muted-foreground">
                {formatHours(entry.seconds)}
              </span>
            </div>
            <div
              aria-hidden
              className="mt-1 h-2 overflow-hidden rounded-full bg-secondary"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(entry.seconds / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-baseline justify-between gap-3 border-t pt-3 text-[15px] text-muted-foreground">
        <span className="font-bold">{t.totalLabel}</span>
        <span className="font-mono">{formatHours(totalSeconds)}</span>
      </p>
      <p className="mt-1 text-[13px] text-muted-foreground">
        {t.categoriesNote}
      </p>
    </div>
  );
}
