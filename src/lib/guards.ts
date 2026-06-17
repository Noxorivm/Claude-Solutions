import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";

export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  // Cuenta desactivada (docs/03 §H4): se cierra la sesión en servidor y
  // se expulsa a /login con el aviso. El catch cubre un token ya
  // revocado: la expulsión ocurre igualmente.
  if (session.user.disabled) {
    try {
      await auth.api.signOut({ headers: await headers() });
    } catch {
      // la sesión ya no era válida; seguimos con la redirección
    }
    redirect("/login?disabled=1");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.role !== "admin") {
    redirect("/app");
  }
  return session;
}
