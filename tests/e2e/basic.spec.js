"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
test_1.test.describe("Basic E2E User Flow", () => {
    (0, test_1.test)("should load the home page and navigate to marketplace", async ({ page, context }) => {
        // Inject localStorage item to skip the tour guide
        await context.addInitScript(() => {
            window.localStorage.setItem("haisan_home_tour_done", "true");
        });
        // Navigate to the home page (baseURL is http://localhost:3000)
        await page.goto("/");
        // Verify the hero heading text
        const heading = page.locator("h1");
        await (0, test_1.expect)(heading).toContainText("Hải sản theo mẻ");
        // Click the explore button
        const exploreBtn = page.locator('[data-tour="home-explore-button"]');
        await (0, test_1.expect)(exploreBtn).toBeVisible();
        await exploreBtn.click();
        // Verify navigation to marketplace
        await (0, test_1.expect)(page).toHaveURL(/\/marketplace/);
    });
});
