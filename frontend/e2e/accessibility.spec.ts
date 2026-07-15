import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { installPublicFixtures } from "./fixtures";
import { publicRoutes } from "./publicRoutes";

test.beforeEach(async ({ page }) => {
  await installPublicFixtures(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const [path] of publicRoutes) {
  test(`${path} has no axe violations`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1_200);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
