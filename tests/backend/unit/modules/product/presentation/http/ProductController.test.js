"use strict";
describe("Smoke Test: modules/product/presentation/http/ProductController.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../backend/src/modules/product/presentation/http/ProductController");
        expect(module).toBeDefined();
    });
});
