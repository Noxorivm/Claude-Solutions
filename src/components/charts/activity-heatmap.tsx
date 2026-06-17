import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDayShort } from "@/lib/format";
import type { HeatmapWeek } from "@/lib/progress";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.progress;

// Rampa R2b-2 «verde noche»: vacío = borde slate-verde (visible por los
// gaps), actividad creciente en oro. AA recalculada (celda vs fondo de
// sección casi sólida #111f1a): L0 1.53 · L1 3.28 · L2 5.01 · L3 8.09.
const INTENSITY_CLASSES = [
  "bg-border",
  "bg-primary/54",
  "bg-primary/74",
  "bg-primary",
] as const;

const MONTH_FORMAT = new Intl.DateTimeFormat("es-ES", {
  timeZone: "Europe/Madrid",
  month: "short",
});

function cellLabel(cell: HeatmapWeek["cells"][number]): string {
  const date = formatDayShort(cell.date);
  if (cell.score === 0) {
    return `${date} · ${t.noActivity}`;
  }
  const parts = [date];
  if (cell.lessons > 0) {
    parts.push(t.lessonsCount(cell.lessons));
  }
  if (cell.minutes > 0) {
    parts.push(strings.practice.minutesShort(cell.minutes));
  }
  return parts.join(" · ");
}

// Heatmap 26×7 (docs/03 §D2, docs/06): tooltips operables por hover y
// foco (Radix) y alternativa textual en tabla sr-only (A11y-9).
export function ActivityHeatmap({ weeks }: { weeks: HeatmapWeek[] }) {
  // Marca de mes en la columna cuyo lunes estrena mes.
  const monthMarks = weeks.map((week, index) => {
    if (index === 0) {
      return MONTH_FORMAT.format(new Date(`${week.start}T12:00:00Z`));
    }
    const previous = weeks[index - 1].start.slice(5, 7);
    const current = week.start.slice(5, 7);
    return previous === current
      ? null
      : MONTH_FORMAT.format(new Date(`${week.start}T12:00:00Z`));
  });

  return (
    <div>
      <TooltipProvider delayDuration={150}>
        <div className="overflow-x-auto pb-1">
          <div className="inline-block">
            <div
              aria-hidden
              className="grid grid-flow-col gap-1 pl-7 text-[11px]"
              style={{ gridTemplateColumns: `repeat(${weeks.length}, 14px)` }}
            >
              {monthMarks.map((mark, index) => (
                <span
                  key={weeks[index].start}
                  className="h-4 overflow-visible whitespace-nowrap text-muted-foreground"
                >
                  {mark ?? ""}
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <div
                aria-hidden
                className="grid w-6 grid-rows-7 gap-1 text-[11px] text-muted-foreground"
              >
                <span className="h-3.5 leading-3.5">L</span>
                <span className="h-3.5" />
                <span className="h-3.5 leading-3.5">X</span>
                <span className="h-3.5" />
                <span className="h-3.5 leading-3.5">V</span>
                <span className="h-3.5" />
                <span className="h-3.5" />
              </div>
              <div className="grid grid-flow-col grid-rows-7 gap-1">
                {weeks.flatMap((week) =>
                  week.cells.map((cell) =>
                    cell.future ? (
                      <span
                        key={cell.date}
                        aria-hidden
                        className="size-3.5 rounded-[3px] bg-secondary opacity-30"
                      />
                    ) : (
                      <Tooltip key={cell.date}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={cellLabel(cell)}
                            data-date={cell.date}
                            data-intensity={cell.intensity}
                            className={cn(
                              "size-3.5 rounded-[3px]",
                              INTENSITY_CLASSES[cell.intensity],
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent>{cellLabel(cell)}</TooltipContent>
                      </Tooltip>
                    ),
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>

      {/* sr-only en el WRAPPER, no en la tabla: una <table> ignora el
          width de 1px (se expande a su contenido) y a 360px empujaba el
          scroll horizontal del documento (F6-T3, A11y-10). */}
      <div className="sr-only">
        <table>
          <caption>{t.heatmapTableCaption}</caption>
          <thead>
            <tr>
              <th scope="col">{t.srWeek}</th>
              <th scope="col">{t.srActiveDays}</th>
              <th scope="col">{t.srLessons}</th>
              <th scope="col">{t.srMinutes}</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => {
              const active = week.cells.filter((cell) => cell.score > 0);
              return (
                <tr key={week.start}>
                  <th scope="row">{formatDayShort(week.start)}</th>
                  <td>{active.length}</td>
                  <td>
                    {week.cells.reduce((acc, cell) => acc + cell.lessons, 0)}
                  </td>
                  <td>
                    {week.cells.reduce((acc, cell) => acc + cell.minutes, 0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
