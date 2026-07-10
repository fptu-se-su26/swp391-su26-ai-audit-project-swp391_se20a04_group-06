import { safeCompare, sanitizeDeep, sanitizeText } from "./security";

describe("security utilities", () => {
  it("compares signatures without changing semantics", () => {
    expect(safeCompare("secret", "secret")).toBe(true);
    expect(safeCompare("secret", "different")).toBe(false);
  });

  it("removes HTML tags and null bytes from user content", () => {
    expect(sanitizeText(" <script>alert(1)</script>Hello\u0000 ")).toBe(
      "alert(1)Hello",
    );
  });

  it("sanitizes nested request bodies", () => {
    expect(
      sanitizeDeep({
        description: "<b>Fresh</b>",
        comments: ["<img src=x onerror=alert(1)>Good"],
      }),
    ).toEqual({ description: "Fresh", comments: ["Good"] });
  });
});
