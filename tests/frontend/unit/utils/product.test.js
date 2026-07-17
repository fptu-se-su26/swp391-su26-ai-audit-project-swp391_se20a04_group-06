import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateDistanceKm,
  formatDistance,
  getFreshness,
  getMarketplaceStatus,
  getProductImage,
} from "../../../../client/src/utils/product";

describe("product utilities", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("selects images using the documented fallback order", () => {
    expect(getProductImage({ coverImg: { url: "cover.jpg" }, images: ["first.jpg"] })).toBe(
      "cover.jpg",
    );
    expect(getProductImage({ images: [{ secure_url: "first.jpg" }] })).toBe("first.jpg");
    expect(getProductImage({})).toBe("/favicon.svg");
  });

  it("classifies product freshness from catch time", () => {
    vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
    expect(getFreshness({ type: "Fresh", catchTime: "2026-07-17T00:00:00Z" })).toBe(
      "Tươi hôm nay",
    );
    expect(getFreshness({ type: "Fresh", catchTime: "2026-07-13T00:00:00Z" })).toBe("Tươi");
    expect(getFreshness({ type: "Frozen" })).toBe("Đã sơ chế / đồ khô");
  });

  it("prioritizes explicit marketplace status and detects stock/expiry", () => {
    vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
    expect(getMarketplaceStatus({ status: "reserved" }).key).toBe("reserved");
    expect(getMarketplaceStatus({ remainingWeight: 0 }).key).toBe("sold-out");
    expect(getMarketplaceStatus({ expiryDate: "2026-07-16T12:00:00Z" }).key).toBe("expired");
    expect(getMarketplaceStatus({ status: "active", remainingWeight: 10 }).key).toBe("available");
  });

  it("calculates and formats geographic distance", () => {
    const distance = calculateDistanceKm(
      { latitude: 10.7769, longitude: 106.7009 },
      { lat: 10.7769, lng: 106.7009 },
    );
    expect(distance).toBeCloseTo(0, 5);
    expect(formatDistance(0.42)).toBe("420 m");
    expect(formatDistance(4.25)).toBe("4.3 km");
    expect(formatDistance(null)).toBe("Chưa có vị trí");
  });
});
