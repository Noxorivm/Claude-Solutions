import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ContinueTarget } from "@/db/queries/dashboard";
import { strings } from "@/lib/strings";

const t = strings.dashboard;
const tc = strings.courseDetail;

// Fila 1 de docs/06 §Layout-Dashboard: tarjeta grande con la lección
// pendiente. Para usuario nuevo orienta hacia la primera de 0-1.
export function ContinueCard({ target }: { target: ContinueTarget | null }) {
  if (!target) {
    return (
      <section className="ornate-frame-strong felt-texture flex size-full flex-col justify-center p-6">
        <p className="max-w-prose text-[15px] text-muted-foreground">
          {t.allDone}
        </p>
        <Button asChild variant="outline" className="mt-4 self-start">
          <Link href="/app/ruta">{strings.app.goToRoute}</Link>
        </Button>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="continue-title"
      className="ornate-frame-strong felt-texture flex size-full flex-col p-6"
    >
      <p id="continue-title" className="heading-eyebrow">
        {target.isNew ? t.startTitle : t.continueTitle}
      </p>
      <p className="mt-3 text-[15px] text-muted-foreground">
        {target.courseTitle}
      </p>
      <h2 className="mt-1 font-display text-2xl tracking-tight">
        {target.lessonTitle}
      </h2>
      <div className="mt-3 flex items-center gap-3 text-[15px] text-muted-foreground">
        <Badge variant="secondary">{tc.lessonTypes[target.lessonType]}</Badge>
        {target.durationMin ? (
          <span>{tc.minutes(target.durationMin)}</span>
        ) : null}
      </div>
      <Button asChild className="mt-6 self-start">
        <Link href={`/app/leccion/${target.lessonSlug}`}>
          {target.isNew ? t.startCta : t.continueCta}
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </section>
  );
}
