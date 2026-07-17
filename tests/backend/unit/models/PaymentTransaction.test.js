"use strict";
describe("Smoke Test: models/PaymentTransaction.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/models/PaymentTransaction");
        expect(module).toBeDefined();
    });
});
