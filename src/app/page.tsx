import { Sparkles } from "lucide-react";
import Link from "next/link";

import { Atmosphere } from "@/components/shell/atmosphere";
import { Button } from "@/components/ui/button";
import { strings } from "@/lib/strings";

// Landing como escaparate atmosférico (R2b-2): la atmósfera es
// protagonista (bajo presupuesto, motion-safe; reduced-motion la deja
// estática), héroe con heading-gilded a gran escala y CTA en oro.
export default function Home() {
  return (
    <>
      <Atmosphere />
      <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
        <span className="hex-medallion" aria-hidden>
          <Sparkles className="size-5 text-primary" strokeWidth={1.75} />
        </span>
        <h1 className="heading-gilded font-display text-5xl tracking-tight sm:text-6xl">
          {strings.common.appName}
        </h1>
        <p className="max-w-md text-balance text-[17px] text-muted-foreground">
          {strings.home.tagline}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="h-12 min-w-40">
            <Link href="/register">{strings.auth.registerTitle}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 min-w-40">
            <Link href="/login">{strings.home.login}</Link>
          </Button>
        </div>
      </main>
    </>
  );
}
