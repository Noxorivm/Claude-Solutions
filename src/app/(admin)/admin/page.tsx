import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getAdminSummary } from "@/db/queries/admin";
import { strings } from "@/lib/strings";

const t = strings.admin.summary;

export default async function AdminHomePage() {
  const summary = await getAdminSummary();

  const cards = [
    {
      label: t.courses,
      value: summary.courses.total,
      detail: t.byStatus(
        summary.courses.draft,
        summary.courses.published,
        summary.courses.archived,
      ),
    },
    {
      label: t.lessons,
      value: summary.lessons.total,
      detail: t.byStatus(
        summary.lessons.draft,
        summary.lessons.published,
        summary.lessons.archived,
      ),
    },
    { label: t.modules, value: summary.modules, detail: null },
    { label: t.techniques, value: summary.techniques, detail: null },
    { label: t.users, value: summary.users, detail: null },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border bg-card p-4">
            <p className="text-[13px] tracking-wide text-muted-foreground uppercase">
              {card.label}
            </p>
            <p className="mt-1 font-mono text-3xl">{card.value}</p>
            {card.detail ? (
              <p className="mt-1 text-[13px] text-muted-foreground">
                {card.detail}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Button asChild variant="outline" className="h-10">
          <Link href="/admin/cursos">{t.manageCourses}</Link>
        </Button>
      </div>
    </>
  );
}
