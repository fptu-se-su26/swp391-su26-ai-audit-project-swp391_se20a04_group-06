"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const security_1 = require("../../../../backend/src/utils/security");
describe("security utilities", () => {
    it("compares signatures without changing semantics", () => {
        expect((0, security_1.safeCompare)("secret", "secret")).toBe(true);
        expect((0, security_1.safeCompare)("secret", "different")).toBe(false);
    });
    it("removes HTML tags and null bytes from user content", () => {
        expect((0, security_1.sanitizeText)(" <script>alert(1)</script>Hello\u0000 ")).toBe("alert(1)Hello");
    });
    it("sanitizes nested request bodies", () => {
        expect((0, security_1.sanitizeDeep)({
            description: "<b>Fresh</b>",
            comments: ["<img src=x onerror=alert(1)>Good"],
        })).toEqual({ description: "Fresh", comments: ["Good"] });
    });
});
