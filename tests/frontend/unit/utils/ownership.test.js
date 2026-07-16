import { describe, it, expect } from "vitest";
import { getIdentityId, canManageOwnedContent } from "../../../../client/src/utils/ownership";

describe("Frontend Ownership Utils", () => {
  describe("getIdentityId", () => {
    it("returns empty string if value is null or undefined", () => {
      expect(getIdentityId(null)).toBe("");
      expect(getIdentityId(undefined)).toBe("");
    });

    it("extracts id from objects", () => {
      expect(getIdentityId({ id: "123" })).toBe("123");
      expect(getIdentityId({ _id: "456" })).toBe("456");
      expect(getIdentityId({ userId: "789" })).toBe("789");
    });

    it("returns string value of string or number", () => {
      expect(getIdentityId("abc")).toBe("abc");
      expect(getIdentityId(123)).toBe("123");
    });
  });

  describe("canManageOwnedContent", () => {
    it("returns false if user is null or undefined", () => {
      expect(canManageOwnedContent(null, "123")).toBe(false);
    });

    it("returns true if user is admin", () => {
      expect(canManageOwnedContent({ role: "admin" }, "123")).toBe(true);
    });

    it("returns true if user id matches owner id", () => {
      expect(canManageOwnedContent({ id: "123" }, "123")).toBe(true);
      expect(canManageOwnedContent({ id: "123" }, { id: "123" })).toBe(true);
    });

    it("returns false if user id does not match owner id", () => {
      expect(canManageOwnedContent({ id: "123" }, "456")).toBe(false);
    });
  });
});
