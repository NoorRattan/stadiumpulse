import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { installPublicFixtures } from "./fixtures";

const publicRoutes = [
  ["/", "Every venue, in one pulse."],
  ["/fan", "Your match day, one tap away."],
  ["/volunteer", "Shift-ready. Zone-aware."],
  ["/staff", "Operate safely. See everything."],
  ["/organizer", "Command every venue, in real time."],
  ["/demo", "One connected match-day story."],
  ["/matches", "Matches & Tickets"],
  ["/venues", "Venues, Gates & Seating"],
  ["/accessibility", "Plan Around Your Needs"],
  ["/amenities", "Food, Retail & Amenities"],
  ["/events", "Fan Zones & Events"],
  ["/sustainability", "A Lower-Impact Match Day"],
  ["/alerts", "Alerts That Explain What to Do"],
  ["/help", "Questions, Answered Clearly"],
  ["/about", "One Match Day. One Shared Picture."],
  ["/contact", "Contact StadiumPulse"],
  ["/privacy", "Privacy in Plain Language"],
  ["/terms", "Terms of Use"],
  ["/concierge", "Ask StadiumPulse."],
  ["/wayfinding", "Find Your Way."],
  ["/travel", "Transport & Parking"],
  ["/login", "Sign In"],
  ["/signup", "Sign Up"],
] as const;

test.beforeEach(async ({ page }) => {
  await installPublicFixtures(page);
});

test("public routes have one heading and no horizontal overflow", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [path, heading] of publicRoutes) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(page.locator("h1")).toHaveCount(1);

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
  }
});

test("public routes have no serious or critical axe violations", async ({
  browserName,
  page,
}) => {
  test.skip(
    browserName !== "chromium",
    "Axe evaluates the rendered accessibility tree independently of browser engine.",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [path] of publicRoutes) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((violation) =>
        ["serious", "critical"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);
  }
});

test("venue signals are keyboard-native and expose selection state", async ({
  page,
}) => {
  await page.goto("/demo", { waitUntil: "domcontentloaded" });
  const venueMap = page.getByRole("region", {
    name: "Interactive stadium venue map",
  });
  await expect(venueMap).toBeVisible({ timeout: 30_000 });

  const zone = venueMap.getByRole("button", {
    name: /Gate 4, 58 percent density/,
  });
  await zone.focus();
  await expect(zone).toBeFocused();
  await zone.press("Enter");
  await expect(zone).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByText("moderate density", { exact: true }),
  ).toBeVisible();
});

test("public concierge answers without requiring sign-in", async ({ page }) => {
  await page.goto("/concierge", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Message").fill("Where is Gate 4?");
  const sendButton = page.getByRole("button", { name: "Send message" });
  await sendButton.focus();
  await expect(sendButton).toBeFocused();
  await sendButton.press("Enter");
  await expect(
    page.getByText("Where is Gate 4?", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Gate 4 is beside the east plaza. Follow the accessible-route signs.",
    ),
  ).toBeVisible();
});

test("voice input fills the concierge message composer", async ({
  browserName,
  page,
}) => {
  test.skip(
    browserName === "firefox",
    "Firefox does not implement the Web Speech Recognition API.",
  );
  await page.addInitScript(() => {
    class MockSpeechRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      onstart: (() => void) | null = null;
      onresult:
        | ((event: { results: { 0: { 0: { transcript: string } } } }) => void)
        | null = null;
      onerror: ((event: { error: string }) => void) | null = null;
      onend: (() => void) | null = null;

      start() {
        this.onstart?.();
        this.onresult?.({
          results: { 0: { 0: { transcript: "Take me to Gate 12" } } },
        });
        this.onend?.();
      }

      stop() {
        this.onend?.();
      }
    }

    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: MockSpeechRecognition,
    });
  });
  await page.goto("/concierge", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Start voice input" }).click();
  await expect(page.getByLabel("Message")).toHaveValue("Take me to Gate 12");
  await expect(page.getByText(/Voice captured/)).toBeVisible();
});

test("account and role portals send signed-out visitors to sign in", async ({
  page,
}) => {
  for (const path of [
    "/account",
    "/ops/organizer",
    "/ops/venue-staff",
    "/ops/command",
  ]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign In");
  }
});

test("skip navigation moves focus and reduced motion stops animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  await expect(page.locator("canvas")).toHaveCount(0);
  const motionStyles = await page
    .locator(".reveal-frame, button, a")
    .evaluateAll((elements) =>
      elements.map((element) => {
        const styles = getComputedStyle(element);
        return {
          animationDuration: styles.animationDuration,
          transitionDuration: styles.transitionDuration,
        };
      }),
    );
  for (const style of motionStyles) {
    expect(parseFloat(style.animationDuration) || 0).toBeLessThanOrEqual(0.01);
    expect(parseFloat(style.transitionDuration) || 0).toBeLessThanOrEqual(0.01);
  }
});

test("theme control is persistent, labelled, and motion-safe", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const toggle = page.getByRole("button", { name: "Switch to light theme" });
  await expect(toggle).toBeVisible();
  await toggle.click();

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("meta[name='theme-color']")).not.toHaveAttribute(
    "content",
    "#0b1121",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("stadiumpulse-theme")),
  ).toBe("light");
  await expect(page.locator("[data-theme-wave-overlay]")).toHaveCount(0);
});
