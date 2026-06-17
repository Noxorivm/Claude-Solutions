import {
  ChartNoAxesColumn,
  LayoutDashboard,
  Map,
  Timer,
  WandSparkles,
} from "lucide-react";

import { strings } from "@/lib/strings";

export const NAV_ITEMS = [
  {
    href: "/app",
    label: strings.nav.dashboard,
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/app/ruta", label: strings.nav.ruta, icon: Map, exact: false },
  {
    href: "/app/practica",
    label: strings.nav.practica,
    icon: Timer,
    exact: false,
  },
  {
    href: "/app/tecnicas",
    label: strings.nav.tecnicas,
    icon: WandSparkles,
    exact: false,
  },
  {
    href: "/app/progreso",
    label: strings.nav.progreso,
    icon: ChartNoAxesColumn,
    exact: false,
  },
] as const;

/** Los 4 de la barra inferior móvil (docs/06 §App shell). */
export const BOTTOM_BAR_ITEMS = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[4],
] as const;
