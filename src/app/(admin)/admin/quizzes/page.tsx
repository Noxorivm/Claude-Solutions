import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { getAdminQuizLessons } from "@/db/queries/admin";
import { strings } from "@/lib/strings";

const t = strings.admin.quizzes;
const statusLabels = strings.admin.courses.statusLabel;

export default async function AdminQuizzesPage() {
  const rows = await getAdminQuizLessons();

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>

      {rows.length === 0 ? (
        <p className="mt-6 text-[14px] text-muted-foreground">{t.empty}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b text-left text-[12px] tracking-wide text-muted-foreground uppercase">
                <th scope="col" className="py-1.5 pr-3 font-bold">
                  {t.colLesson}
                </th>
                <th scope="col" className="py-1.5 pr-3 font-bold">
                  {t.colWhere}
                </th>
                <th scope="col" className="py-1.5 pr-3 font-bold">
                  {t.colState}
                </th>
                <th scope="col" className="py-1.5 font-bold">
                  {t.colPassPct}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.lessonId}>
                  <td className="py-1.5 pr-3">
                    <Link
                      href={`/admin/quizzes/${row.lessonSlug}`}
                      className="text-info underline underline-offset-2 hover:text-foreground"
                    >
                      {row.lessonTitle}
                    </Link>{" "}
                    <span className="text-[12px] text-muted-foreground">
                      ({statusLabels[row.lessonStatus] ?? row.lessonStatus})
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 text-muted-foreground">
                    {row.courseTitle} → {row.moduleTitle}
                  </td>
                  <td className="py-1.5 pr-3">
                    {!row.quizId ? (
                      <Badge
                        variant="outline"
                        className="border-destructive/50 text-danger-ink"
                      >
                        {t.stateNoQuiz}
                      </Badge>
                    ) : row.questionCount === 0 ? (
                      <Badge
                        variant="outline"
                        className="border-info/60 text-info"
                      >
                        {t.stateNoQuestions}
                      </Badge>
                    ) : (
                      <span className="font-mono text-[13px]">
                        {t.stateSummary(row.questionCount, row.attemptCount)}
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 font-mono">
                    {row.passPct != null ? `${row.passPct}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
