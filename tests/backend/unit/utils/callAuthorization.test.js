"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const callAuthorization_1 = require("../../../../backend/src/utils/callAuthorization");
describe("WebRTC signaling authorization", () => {
    const sellerId = "seller";
    const buyerId = "buyer";
    it("allows a buyer to call the product seller", () => {
        expect((0, callAuthorization_1.canSignalProductCall)(sellerId, buyerId, sellerId)).toBe(true);
    });
    it("allows the seller to call a buyer", () => {
        expect((0, callAuthorization_1.canSignalProductCall)(sellerId, sellerId, buyerId)).toBe(true);
    });
    it("rejects unrelated and self calls", () => {
        expect((0, callAuthorization_1.canSignalProductCall)(sellerId, "stranger-a", "stranger-b")).toBe(false);
        expect((0, callAuthorization_1.canSignalProductCall)(sellerId, sellerId, sellerId)).toBe(false);
    });
});
