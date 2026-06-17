import Link from "next/link";

import type { DueTechniqueRow } from "@/db/queries/practice";
import { strings } from "@/lib/strings";

const t = strings.dashboard;

// Fila 2 de docs/06 §Layout-Dashboard: chips de técnicas con repaso
// vencido (docs/03 §E4); vacío honesto cuando no toca nada.
export function ReviewsCard({ due }: { due: DueTechniqueRow[] }) {
  return (
    <section
      aria-labelledby="reviews-title"
      className="card-lift rounded-2xl border bg-card p-5"
    >
      <h2 id="reviews-title" className="heading-eyebrow">
        {t.reviewsTitle}
      </h2>
      {due.length === 0 ? (
        <p className="mt-2 text-[15px] text-muted-foreground">
          {t.reviewsEmpty}
        </p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {due.map((technique) => (
            <li key={technique.id}>
              <Link
                href={`/app/tecnicas/${technique.slug}`}
                className="inline-flex min-h-9 items-center gap-2 rounded-full border border-primary/50 px-3 py-1 text-[13px] hover:bg-accent"
              >
                <span>{technique.name}</span>
                {technique.daysOverdue > 0 ? (
                  <span className="text-muted-foreground">
                    {t.overdueDays(technique.daysOverdue)}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
