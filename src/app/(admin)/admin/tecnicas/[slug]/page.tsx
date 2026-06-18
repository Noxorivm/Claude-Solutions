import Link from "next/link";
import { notFound } from "next/navigation";

import { TechniqueActions } from "@/components/admin/technique-actions";
import { TechniqueForm } from "@/components/admin/technique-form";
import { getAdminTechniqueDetail } from "@/db/queries/admin";
import { strings } from "@/lib/strings";

const t = strings.admin.techniques;

export default async function AdminTecnicaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const technique = await getAdminTechniqueDetail(slug);
  if (!technique) {
    notFound();
  }

  return (
    <>
      <Link
        href="/admin/tecnicas"
        className="text-[13px] text-muted-foreground hover:text-foreground"
      >
        ← {t.title}
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{technique.name}</h1>
        <TechniqueActions
          techniqueId={technique.id}
          name={technique.name}
          lessonLinks={technique.lessonLinks}
          inUse={technique.practiceCount > 0 || technique.masteryCount > 0}
        />
      </div>

      <div className="mt-6">
        <TechniqueForm
          initial={{
            id: technique.id,
            name: technique.name,
            slug: technique.slug,
            category: technique.category as
              | "conversation"
              | "prompting"
              | "tools"
              | "api"
              | "agents"
              | "theory",
            levelNumber: technique.levelNumber,
            descriptionMd: technique.descriptionMd ?? "",
          }}
        />
      </div>
    </>
  );
}
