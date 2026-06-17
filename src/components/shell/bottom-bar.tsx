import { Menu, User, WandSparkles } from "lucide-react";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { BOTTOM_BAR_ITEMS } from "@/components/shell/nav-items";
import { NavLink } from "@/components/shell/nav-link";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { strings } from "@/lib/strings";

export function BottomBar({ userName }: { userName: string }) {
  return (
    <nav
      aria-label={strings.shell.mainNav}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-border bg-sidebar md:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {BOTTOM_BAR_ITEMS.map((item) => (
          <li key={item.href} className="h-full">
            <NavLink
              href={item.href}
              exact={item.exact}
              className="flex h-full min-h-11 flex-col items-center justify-center gap-1 text-[13px] text-sidebar-foreground"
              activeClassName="text-sidebar-primary font-bold"
            >
              <item.icon className="size-5" strokeWidth={1.75} aria-hidden />
              {item.label}
            </NavLink>
          </li>
        ))}
        <li className="h-full">
          <Sheet>
            <SheetTrigger className="flex h-full min-h-11 w-full flex-col items-center justify-center gap-1 text-[13px] text-sidebar-foreground">
              <Menu className="size-5" strokeWidth={1.75} aria-hidden />
              {strings.shell.more}
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>{strings.shell.moreMenu}</SheetTitle>
              </SheetHeader>
              <ul className="space-y-1 px-4 pb-4">
                <li>
                  <SheetClose asChild>
                    <Link
                      href="/app/tecnicas"
                      className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] hover:bg-accent"
                    >
                      <WandSparkles
                        className="size-5"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      {strings.nav.tecnicas}
                    </Link>
                  </SheetClose>
                </li>
                <li>
                  <SheetClose asChild>
                    <Link
                      href="/app/perfil"
                      className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] hover:bg-accent"
                    >
                      <User className="size-5" strokeWidth={1.75} aria-hidden />
                      {userName}
                    </Link>
                  </SheetClose>
                </li>
                <li className="flex items-center justify-between gap-2 px-1 pt-2">
                  <ThemeToggle />
                  <LogoutButton />
                </li>
              </ul>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
