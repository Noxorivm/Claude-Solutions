import { UserRowActions } from "@/components/admin/user-row-actions";
import { Badge } from "@/components/ui/badge";
import { getAdminUsers } from "@/db/queries/admin";
import { formatMadridDateShort } from "@/lib/format";
import { requireAdmin } from "@/lib/guards";
import { strings } from "@/lib/strings";

const t = strings.admin.users;

export default async function AdminUsuariosPage() {
  const session = await requireAdmin();
  const users = await getAdminUsers();
  const adminCount = users.filter(
    (row) => row.role === "admin" && !row.disabled,
  ).length;

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>

      {users.length === 0 ? (
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
                  {t.colEmail}
                </th>
                <th scope="col" className="py-1.5 pr-3 font-bold">
                  {t.colRole}
                </th>
                <th scope="col" className="py-1.5 pr-3 font-bold">
                  {t.colXp}
                </th>
                <th scope="col" className="py-1.5 pr-3 font-bold">
                  {t.colSignup}
                </th>
                <th scope="col" className="py-1.5 pr-3 font-bold">
                  {t.colState}
                </th>
                <th scope="col" className="py-1.5">
                  <span className="sr-only">{t.title}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((row) => (
                <tr key={row.id}>
                  <td className="py-1.5 pr-3">
                    {row.name}{" "}
                    {row.id === session.user.id ? (
                      <span className="text-[12px] text-muted-foreground">
                        {t.youTag}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-1.5 pr-3 text-muted-foreground">
                    {row.email}
                  </td>
                  <td className="py-1.5 pr-3">
                    <Badge
                      variant="outline"
                      className={
                        row.role === "admin"
                          ? "border-info/60 text-info"
                          : "border-border text-muted-foreground"
                      }
                    >
                      {t.roleLabels[row.role] ?? row.role}
                    </Badge>
                  </td>
                  <td className="py-1.5 pr-3 font-mono">{row.xp}</td>
                  <td className="py-1.5 pr-3 text-muted-foreground">
                    {formatMadridDateShort(row.createdAt)}
                  </td>
                  <td className="py-1.5 pr-3">
                    {row.disabled ? (
                      <Badge
                        variant="outline"
                        className="border-destructive/50 text-danger-ink"
                      >
                        {t.stateDisabled}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-success-ink/60 text-success-ink"
                      >
                        {t.stateActive}
                      </Badge>
                    )}
                  </td>
                  <td className="py-1.5">
                    <UserRowActions
                      userId={row.id}
                      name={row.name}
                      role={row.role}
                      disabled={row.disabled}
                      isSelf={row.id === session.user.id}
                      adminCount={adminCount}
                    />
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
