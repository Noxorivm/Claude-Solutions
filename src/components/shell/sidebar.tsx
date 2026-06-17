import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { NAV_ITEMS } from "@/components/shell/nav-items";
import { NavLink } from "@/components/shell/nav-link";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { strings } from "@/lib/strings";

export function Sidebar({ userName }: { userName: string }) {
  return (
    <aside className="felt-texture fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="px-6 py-5">
        <Link
          href="/app"
          className="heading-gilded font-display text-2xl tracking-tight"
        >
          {strings.common.appName}
        </Link>
      </div>
      <nav aria-label={strings.shell.mainNav} className="flex-1 px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <NavLink
                href={item.href}
                exact={item.exact}
                className="nav-indicator flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-sidebar-foreground hover:bg-sidebar-accent"
                activeClassName="bg-sidebar-accent text-sidebar-primary font-bold"
              >
                <item.icon className="size-5" strokeWidth={1.75} aria-hidden />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="space-y-2 border-t border-sidebar-border p-4">
        <Link
          href="/app/perfil"
          aria-label={strings.shell.profileOf(userName)}
          className="block truncate rounded-lg px-3 py-2.5 text-[15px] text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {userName}
        </Link>
        <div className="flex items-center justify-between gap-2 px-1">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
