"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../../../backend/src/middlewares/auth");
function createResponse() {
    const response = {
        statusCode: 200,
        body: undefined,
        status: jest.fn((code) => {
            response.statusCode = code;
            return response;
        }),
        json: jest.fn((body) => {
            response.body = body;
            return response;
        }),
    };
    return response;
}
describe("RBAC guards", () => {
    it("allows only Admin through adminOnly", () => {
        const next = jest.fn();
        (0, auth_1.adminOnly)({ user: { userId: "admin", role: "Admin" } }, createResponse(), next);
        expect(next).toHaveBeenCalledTimes(1);
        const denied = createResponse();
        (0, auth_1.adminOnly)({ user: { userId: "buyer", role: "User" } }, denied, jest.fn());
        expect(denied.statusCode).toBe(403);
    });
    it("allows a seller session and rejects a buyer session", () => {
        const next = jest.fn();
        (0, auth_1.sellerOnly)({ user: { userId: "seller", role: "User", sessionRole: "seller" } }, createResponse(), next);
        expect(next).toHaveBeenCalledTimes(1);
        const denied = createResponse();
        (0, auth_1.sellerOnly)({ user: { userId: "buyer", role: "User", sessionRole: "buyer" } }, denied, jest.fn());
        expect(denied.statusCode).toBe(403);
        expect(denied.body.code).toBe("SELLER_ONLY");
    });
    it("allows Admin through sellerOnly regardless of session mode", () => {
        const next = jest.fn();
        (0, auth_1.sellerOnly)({ user: { userId: "admin", role: "Admin", sessionRole: "buyer" } }, createResponse(), next);
        expect(next).toHaveBeenCalledTimes(1);
    });
});
