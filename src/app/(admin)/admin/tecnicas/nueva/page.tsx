import { TechniqueForm } from "@/components/admin/technique-form";
import { strings } from "@/lib/strings";

export default function AdminNuevaTecnicaPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">
        {strings.admin.techniques.form.createTitle}
      </h1>
      <div className="mt-5">
        <TechniqueForm />
      </div>
    </>
  );
}
