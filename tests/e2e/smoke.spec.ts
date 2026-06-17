import { expect, test } from "@playwright/test";

test("home responds 200 and shows Claude Solutions", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "Claude Solutions" }),
  ).toBeVisible();
});
