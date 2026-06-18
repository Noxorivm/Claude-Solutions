// Render del cuerpo de una lección (CS-T4b): blinda el cableado de
// content:apply. Si en CI/prod corriera el seed pero NO content:apply, los
// cuerpos quedarían en "[REDACTAR]" y este test fallaría.
//
// Por qué el admin y no la ruta del alumno: el curso 0.1 está en draft y
// getLessonDetail solo sirve lecciones published, así que el alumno no la
// ve. La preview del editor del admin renderiza con EXACTAMENTE el mismo
// componente que el alumno (MarkdownContent), de modo que comprobamos el
// render real del markdown sin publicar nada.
import "dotenv/config";

import { expect, test } from "@playwright/test";

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

test("el cuerpo de una lección del curso 0.1 renderiza (no queda en [REDACTAR])", async ({
  page,
}) => {
  if (!adminEmail || !adminPassword) {
    throw new Error(
      "SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD son necesarias para el e2e de contenido",
    );
  }

  // --- login como admin (lo crea el seed) ---
  await page.goto("/login");
  await page.fill("#email", adminEmail);
  await page.fill("#password", adminPassword);
  await page.click("button[type=submit]");
  await page.waitForURL(/\/app($|\/)/, { timeout: 15000 });

  // --- editor de la lección: la preview usa MarkdownContent (igual que el alumno) ---
  await page.goto("/admin/lecciones/0-1-que-es-claude");
  const preview = page.getByTestId("md-preview");
  await expect(preview).toBeVisible();

  // Sección real de la anatomía (docs/02 §3): el cuerpo abre con "Objetivo".
  await expect(preview).toContainText("Objetivo");
  // El placeholder del seed NO debe sobrevivir a content:apply.
  await expect(preview).not.toContainText("[REDACTAR]");
});
