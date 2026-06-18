import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getAdminTechniques } from "@/db/queries/admin";
import { strings } from "@/lib/strings";

const t = strings.admin.techniques;
const categoryLabels = strings.techniques.categories;

const CATEGORY_VALUES = [
  "conversation",
  "prompting",
  "tools",
  "api",
  "agents",
  "theory",
];

export default async function AdminTecnicasPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; nivel?: string }>;
}) {
  const { categoria = "", nivel = "" } = await searchParams;
  const all = await getAdminTechniques();
  const filtered = all.filter((technique) => {
    if (categoria && technique.category !== categoria) return false;
    if (nivel !== "" && technique.levelNumber !== Number(nivel)) return false;
    return true;
  });
  const hasFilters = categoria !== "" || nivel !== "";
  const selectClass =
    "border-input bg-background h-9 rounded-md border px-2 text-[14px]";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <Button asChild className="h-10">
          <Link href="/admin/tecnicas/nueva">{t.newTechnique}</Link>
        </Button>
      </div>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="filtro-categoria" className="text-[13px] font-bold">
            {t.filterCategory}
          </label>
          <select
            id="filtro-categoria"
            name="categoria"
            defaultValue={categoria}
            className={selectClass}
          >
            <option value="">{t.allOption}</option>
            {CATEGORY_VALUES.map((value) => (
              <option key={value} value={value}>
                {categoryLabels[value] ?? value}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="filtro-nivel" className="text-[13px] font-bold">
            {t.filterLevel}
          </label>
          <select
            id="filtro-nivel"
            name="nivel"
            defaultValue={nivel}
            className={selectClass}
          >
            <option value="">{t.allOption}</option>
            {[0, 1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline" className="h-9">
          {t.apply}
        </Button>
        {hasFilters ? (
          <Button asChild variant="ghost" className="h-9">
            <Link href="/admin/tecnicas">{t.clear}</Link>
          </Button>
        ) : null}
      </form>

      {filtered.length === 0 ? (
        <p className="mt-6 text-[14px] text-muted-foreground">{t.empty}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b text-left text-[12px] tracking-wide text-muted-foreground uppercase">
                <th scope="col" className="py-1.5 pr-3 font-bold">
                  {t.colName}
                </th>
                <th scope="col" className="py-1.5 pr-3 font-bold">
                  {t.colCategory}
                </th>
                <th scope="col" className="py-1.5 pr-3 font-bold">
                  {t.colLevel}
                </th>
                <th scope="col" className="py-1.5 font-bold">
                  {t.colLessons}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((technique) => (
                <tr key={technique.id}>
                  <td className="py-1.5 pr-3">
                    <Link
                      href={`/admin/tecnicas/${technique.slug}`}
                      className="text-info underline underline-offset-2 hover:text-foreground"
                    >
                      {technique.name}
                    </Link>
                  </td>
                  <td className="py-1.5 pr-3">
                    {categoryLabels[technique.category] ?? technique.category}
                  </td>
                  <td className="py-1.5 pr-3 font-mono">
                    {technique.levelNumber}
                  </td>
                  <td className="py-1.5 font-mono">{technique.lessonCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
