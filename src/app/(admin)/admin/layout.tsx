import Link from "next/link";

import { NavLink } from "@/components/shell/nav-link";
import { requireAdmin } from "@/lib/guards";
import { strings } from "@/lib/strings";

const t = strings.admin;

// Layout sobrio del admin (docs/06 §Layout-Admin): sin tapete ni naipes,
// densidad alta, navegación propia.
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return (
    <div className="min-h-screen">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {strings.shell.skipLink}
      </a>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="font-display text-lg tracking-tight">{t.title}</span>
          <nav
            aria-label={t.title}
            className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-[14px]"
          >
            <NavLink
              href="/admin"
              exact
              className="rounded px-1 py-0.5 text-muted-foreground hover:text-foreground"
              activeClassName="text-foreground font-bold"
            >
              {t.nav.resumen}
            </NavLink>
            <NavLink
              href="/admin/cursos"
              className="rounded px-1 py-0.5 text-muted-foreground hover:text-foreground"
              activeClassName="text-foreground font-bold"
            >
              {t.nav.cursos}
            </NavLink>
            <NavLink
              href="/admin/lecciones"
              className="rounded px-1 py-0.5 text-muted-foreground hover:text-foreground"
              activeClassName="text-foreground font-bold"
            >
              {t.nav.lecciones}
            </NavLink>
            <NavLink
              href="/admin/tecnicas"
              className="rounded px-1 py-0.5 text-muted-foreground hover:text-foreground"
              activeClassName="text-foreground font-bold"
            >
              {t.nav.tecnicas}
            </NavLink>
            <NavLink
              href="/admin/quizzes"
              className="rounded px-1 py-0.5 text-muted-foreground hover:text-foreground"
              activeClassName="text-foreground font-bold"
            >
              {t.nav.quizzes}
            </NavLink>
            <NavLink
              href="/admin/usuarios"
              className="rounded px-1 py-0.5 text-muted-foreground hover:text-foreground"
              activeClassName="text-foreground font-bold"
            >
              {t.nav.usuarios}
            </NavLink>
          </nav>
          <Link
            href="/app"
            className="text-[14px] text-muted-foreground hover:text-foreground"
          >
            {t.backToApp}
          </Link>
        </div>
      </header>
      <main
        id="contenido"
        tabIndex={-1}
        className="mx-auto max-w-[1280px] px-4 py-6"
      >
        {children}
      </main>
    </div>
  );
}
