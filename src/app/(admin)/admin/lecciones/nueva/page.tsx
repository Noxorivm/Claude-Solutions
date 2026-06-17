import { LessonForm } from "@/components/admin/lesson-form";
import { getModuleOptions } from "@/db/queries/admin";
import { strings } from "@/lib/strings";

export default async function AdminNuevaLeccionPage() {
  const moduleOptions = await getModuleOptions();
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">
        {strings.admin.lessonForm.createTitle}
      </h1>
      <div className="mt-5">
        <LessonForm moduleOptions={moduleOptions} />
      </div>
    </>
  );
}
