import { Atmosphere } from "@/components/shell/atmosphere";
import { BottomBar } from "@/components/shell/bottom-bar";
import { Sidebar } from "@/components/shell/sidebar";
import { requireUser } from "@/lib/guards";
import { strings } from "@/lib/strings";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireUser();
  return (
    <div className="min-h-screen md:pl-60">
      <Atmosphere />
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {strings.shell.skipLink}
      </a>
      <Sidebar userName={session.user.name} />
      <main
        id="contenido"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1100px] px-4 pt-8 pb-24 md:px-8 md:pb-10"
      >
        {children}
      </main>
      <BottomBar userName={session.user.name} />
    </div>
  );
}
