import { CourseForm } from "@/components/admin/course-form";
import { strings } from "@/lib/strings";

export default function AdminNuevoCursoPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">
        {strings.admin.form.createTitle}
      </h1>
      <div className="mt-5 max-w-3xl">
        <CourseForm />
      </div>
    </>
  );
}
