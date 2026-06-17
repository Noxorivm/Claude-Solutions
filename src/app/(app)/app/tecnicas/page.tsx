import Link from "next/link";

import { MasteryDial } from "@/components/practice/mastery-dial";
import { Button } from "@/components/ui/button";
import { getTechniquesList } from "@/db/queries/techniques";
import { formatRelativeDays } from "@/lib/format";
import { requireUser } from "@/lib/guards";
import { strings } from "@/lib/strings";

const t = strings.techniques;
const CATEGORY_LABELS = strings.techniques.categories;

const MASTERY_FILTERS = ["1", "2", "3", "4", "5"] as const;

export default async function TecnicasPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; dominio?: string }>;
}) {
  const { categoria = "", dominio = "" } = await searchParams;
  const session = await requireUser();
  const all = await getTechniquesList(session.user.id);
  const now = new Date();

  const filtered = all.filter((row) => {
    if (categoria && row.category !== categoria) {
      return false;
    }
    if (dominio === "sin-empezar") {
      return (row.mastery ?? 0) === 0;
    }
    if (dominio) {
      return (row.mastery ?? 0) === Number(dominio);
    }
    return true;
  });

  const hasFilters = categoria !== "" || dominio !== "";

  return (
    <>
      <h1 className="heading-gilded font-display text-3xl tracking-tight">
        {t.title}
      </h1>
      <p className="mt-2 text-muted-foreground">{t.intro}</p>

      <form
        method="get"
        className="ornate-frame-sutil felt-texture mt-6 flex flex-wrap items-end gap-3 p-4"
        aria-label={t.applyFilters}
      >
        <div className="space-y-1.5">
          <label htmlFor="filtro-categoria" className="text-sm font-bold">
            {t.categoryLabel}
          </label>
          <select
            id="filtro-categoria"
            name="categoria"
            defaultValue={categoria}
            className="h-11 rounded-lg border border-input bg-background px-3 text-[15px]"
          >
            <option value="">{t.allOption}</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="filtro-dominio" className="text-sm font-bold">
            {t.masteryLabel}
          </label>
          <select
            id="filtro-dominio"
            name="dominio"
            defaultValue={dominio}
            className="h-11 rounded-lg border border-input bg-background px-3 text-[15px]"
          >
            <option value="">{t.allOption}</option>
            <option value="sin-empezar">{t.notStartedOption}</option>
            {MASTERY_FILTERS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline" className="h-11">
          {t.applyFilters}
        </Button>
        {hasFilters ? (
          <Button asChild variant="ghost" className="h-11">
            <Link href="/app/tecnicas">{t.clearFilters}</Link>
          </Button>
        ) : null}
      </form>

      <p className="mt-4 font-mono text-[13px] text-muted-foreground">
        {t.resultsCount(filtered.length, all.length)}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-6 text-[15px] text-muted-foreground">
          {t.emptyFilter}
        </p>
      ) : (
        // Tarjetas de técnica (R2b-2): lista accesible, marco sutil +
        // veladura, MasteryDial armonizado. Mismos datos que la tabla.
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => (
            <li key={row.id} className="ornate-frame-sutil felt-texture p-4">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/app/tecnicas/${row.slug}`}
                  className="text-[15px] font-bold text-info underline underline-offset-2 hover:text-foreground"
                >
                  {row.name}
                </Link>
                {(row.mastery ?? 0) > 0 ? (
                  <MasteryDial mastery={row.mastery ?? 0} size="sm" />
                ) : (
                  <span className="shrink-0 text-[13px] text-muted-foreground">
                    {t.never}
                  </span>
                )}
              </div>
              <p className="mt-2">
                <span className="inline-flex items-center rounded-4xl bg-secondary px-2 py-0.5 text-[13px] text-secondary-foreground">
                  {CATEGORY_LABELS[row.category] ?? row.category}
                </span>
              </p>
              <dl className="mt-3 space-y-1 text-[13px] text-muted-foreground">
                <div className="flex justify-between gap-2">
                  <dt>{t.colLastPracticed}</dt>
                  <dd className="font-mono">
                    {row.lastPracticedAt
                      ? formatRelativeDays(row.lastPracticedAt, now)
                      : t.never}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>{t.colNextReview}</dt>
                  <dd className="font-mono">
                    {row.nextReviewAt
                      ? formatRelativeDays(row.nextReviewAt, now)
                      : t.never}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
