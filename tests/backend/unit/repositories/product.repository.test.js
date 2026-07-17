"use strict";
describe("Smoke Test: repositories/product.repository.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/repositories/product.repository");
        expect(module).toBeDefined();
    });
});
