import { test, expect } from "@playwright/test";

test.describe("Basic E2E User Flow", () => {
  test("should load the home page and navigate to marketplace", async ({ page, context }) => {
    // Inject localStorage item to skip the tour guide
    await context.addInitScript(() => {
      window.localStorage.setItem("haisan_home_tour_done", "true");
    });

    // Navigate to the home page (baseURL is http://localhost:5173)
    await page.goto("/");

    // Verify the hero heading text
    const heading = page.locator("h1");
    await expect(heading).toContainText("Hải sản theo mẻ");

    // Click the explore button
    const exploreBtn = page.locator('[data-tour="home-explore-button"]');
    await expect(exploreBtn).toBeVisible();
    await exploreBtn.click();

    // Verify navigation to marketplace
    await expect(page).toHaveURL(/\/marketplace/);
  });
});
