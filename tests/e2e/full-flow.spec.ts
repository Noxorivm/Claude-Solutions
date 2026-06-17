// Flujo E2E completo (docs/07 §F6-T2): registro → completar la primera
// lección → registrar práctica manual → dashboard con racha/XP/continuar.
// Corre contra una BD real con seed (dev 5433 en local, service en CI).
import "dotenv/config";

import { expect, test } from "@playwright/test";
import postgres from "postgres";

const email = `f6t2-e2e-${Date.now()}@claude-solutions.dev`;
const password = "sombrero-de-copa-12";

// Teardown por SQL: el cascade de user limpia progreso, práctica, XP,
// días de actividad y sesiones. Email único por run → idempotente.
test.afterAll(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for the e2e teardown");
  }
  const sql = postgres(url, { max: 1 });
  try {
    await sql`DELETE FROM "user" WHERE email = ${email}`;
  } finally {
    await sql.end();
  }
});

// TODO [CS-T1]: el currículo arranca vacío (0 cursos/lecciones/técnicas), así
// que este full-flow no tiene contenido contra el que correr (no hay curso 0-1,
// ni lección que completar, ni técnica que registrar). Se mantiene SKIP hasta
// que exista currículo de Claude Solutions; reactívalo cuando el seed traiga
// al menos un curso publicado con su primera lección y una técnica.
test.skip("registro → lección completada → práctica → dashboard", async ({
  page,
}) => {
  // --- registro (login implícito) ---
  await page.goto("/register");
  await page.fill("#name", "E2E Full Flow");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("button[type=submit]");
  await page.waitForURL(/\/app($|\/)/, { timeout: 15000 });

  // --- ruta → curso 0-1 → primera lección ---
  await page.goto("/app/ruta");
  await page.locator("a[href^='/app/cursos/0-1']").first().click();
  await page.waitForURL(/\/app\/cursos\/0-1/);
  await page.getByRole("link", { name: "Empezar", exact: true }).click();
  await page.waitForURL(/\/app\/leccion\//);

  // --- completar la lección ---
  await page.getByRole("button", { name: "Marcar como completada" }).click();
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /Lección completada · \+\d+ XP/ })
      .first(),
  ).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("button", { name: "Desmarcar" })).toBeVisible();
  const nextHref = await page
    .getByRole("link", { name: "Siguiente" })
    .getAttribute("href");
  expect(nextHref).toMatch(/^\/app\/leccion\//);

  // --- práctica manual: 10 minutos de hoy con técnica ---
  await page.goto("/app/practica");
  await page.fill("#manual-minutes", "10");
  await page.selectOption("#manual-technique", { index: 1 });
  const techniqueName = (
    await page.locator("#manual-technique option:checked").innerText()
  ).trim();
  await page.getByRole("button", { name: "Guardar sesión" }).click();
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /Sesión guardada · \+\d+ XP/ })
      .first(),
  ).toBeVisible({ timeout: 10000 });
  const todaySection = page.locator("section", {
    has: page.getByRole("heading", { name: "Hoy" }),
  });
  await expect(todaySection.getByText(techniqueName).first()).toBeVisible({
    timeout: 10000,
  });
  await expect(todaySection.getByText("10 min").first()).toBeVisible();

  // --- dashboard: racha 1, XP > 0, Continuar → segunda lección ---
  await page.goto("/app");
  const streakCard = page.locator("section", {
    has: page.locator("#streak-title"),
  });
  await expect(streakCard.locator(".font-mono")).toHaveText("1");

  const levelCard = page.locator("section", {
    has: page.locator("#level-title"),
  });
  const xpText = await levelCard.getByText(/^\d+ XP$/).innerText();
  expect(Number(xpText.replace(" XP", ""))).toBeGreaterThan(0);

  await expect(
    page.getByRole("link", { name: "Continuar", exact: true }),
  ).toHaveAttribute("href", nextHref ?? "");
});
