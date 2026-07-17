"use strict";
describe("Smoke Test: models/Product.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/models/Product");
        expect(module).toBeDefined();
    });
});
