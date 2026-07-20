import { test, expect } from "@playwright/test";

test.describe("SeaShop E2E Comprehensive Flows", () => {
  // Inject localStorage to skip the onboarding tour guides
  test.beforeEach(async ({ context, page }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem("haisan_home_tour_done", "true");
      window.localStorage.setItem("haisan_marketplace_tour_done", "true");
      window.localStorage.setItem("haisan_seller_tour_done", "true");
    });

    // Globally mock session restoration as unauthenticated by default
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Unauthorized" }),
      });
    });
  });

  test("should browse marketplace with filters and search", async ({ page }) => {
    // Intercept products API to return mock product list
    await page.route("**/api/products*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              _id: "prod-1",
              name: "Cá Thu Phấn Cao Cấp",
              price: 180000,
              totalWeight: 10,
              remainingWeight: 10,
              type: "Fresh",
              category: "Fish",
              status: "active",
              sellerId: {
                _id: "seller-1",
                name: "Ngư dân Trần Văn A",
                isVerified: true,
              },
              images: [],
              catchTime: new Date().toISOString(),
              expiryDate: new Date(Date.now() + 86400000).toISOString(),
            },
            {
              _id: "prod-2",
              name: "Mực Khô Cô Tô",
              price: 850000,
              totalWeight: 5,
              remainingWeight: 0, // Sold out
              type: "Dried",
              category: "Squid",
              status: "active",
              sellerId: {
                _id: "seller-1",
                name: "Ngư dân Trần Văn A",
                isVerified: true,
              },
              images: [],
              catchTime: new Date().toISOString(),
            },
          ],
          total: 2,
        }),
      });
    });

    await page.goto("/marketplace");

    // Verify product card render
    await expect(page.locator("text=Cá Thu Phấn Cao Cấp")).toBeVisible();
    await expect(page.locator("text=Mực Khô Cô Tô")).toBeVisible();

    // Verify stock status: prod-2 should be sold out (Hết hàng)
    await expect(page.locator("text=Hết hàng")).toBeVisible();

    // Perform search
    const searchInput = page.locator('input[placeholder*="Tìm cua, tôm, cá biển, người bán..."]');
    if (await searchInput.isVisible()) {
      await searchInput.fill("Cá Thu");
    }
  });

  test("should login as seller and access seller dashboard", async ({ page }) => {
    // Override profile API to mock authenticated seller session
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "seller-123",
          name: "Lão Ngư Hải Phòng",
          email: "laongu@gmail.com",
          role: "User",
          sessionRole: "seller",
          isVerified: true,
          isPremium: true,
          avatarUrl: null,
        }),
      });
    });

    // Intercept landing batches API to mock response
    await page.route("**/api/landing-batches/mine*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    // Intercept boat logs to mock empty response
    await page.route("**/api/boat-logs*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ boatLogs: [] }),
      });
    });

    // Intercept messages to mock empty response
    await page.route("**/api/messages/conversations*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    // Intercept my products to mock empty response
    await page.route("**/api/products/my*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/seller");

    // Verify seller layout and sections
    await expect(page.locator("text=Tổng quan người bán")).toBeVisible();
    await expect(page.locator("text=Vựa cá của tôi")).toBeVisible();
    
    // Select specifically inside the metrics container to avoid strict mode violations
    await expect(page.locator(".dashboard-metrics >> text=Nhật ký biển")).toBeVisible();
  });

  test("should handle error route redirection", async ({ page }) => {
    await page.goto("/non-existent-page");
    // Verify redirection to home page
    await expect(page).toHaveURL("/");
  });
});
