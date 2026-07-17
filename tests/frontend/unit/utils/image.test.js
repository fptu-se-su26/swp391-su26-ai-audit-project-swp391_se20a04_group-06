import { describe, expect, it } from "vitest";
import { getOptimizedImageUrl, getRecipeImageSrcSet } from "../../../../client/src/utils/image";

const CLOUDINARY = "https://res.cloudinary.com/demo/image/upload/v1/fish.jpg";

describe("image utilities", () => {
  it("adds Cloudinary delivery transformations", () => {
    expect(getOptimizedImageUrl(CLOUDINARY, 400, 250)).toContain(
      "/image/upload/w_400,h_250,c_fill,q_auto,f_auto/",
    );
  });

  it("does not duplicate an existing transformation", () => {
    const transformed = getOptimizedImageUrl(CLOUDINARY, 400, 250);
    expect(getOptimizedImageUrl(transformed, 400, 250)).toBe(transformed);
  });

  it("leaves local and external non-Cloudinary images unchanged", () => {
    expect(getOptimizedImageUrl("/images/fish.png")).toBe("/images/fish.png");
    expect(getOptimizedImageUrl("https://example.com/fish.png")).toBe(
      "https://example.com/fish.png",
    );
  });

  it("creates a responsive srcset for recipe images", () => {
    const srcset = getRecipeImageSrcSet(CLOUDINARY);
    expect(srcset).toContain("480w");
    expect(srcset).toContain("800w");
    expect(srcset).toContain("1200w");
  });
});
