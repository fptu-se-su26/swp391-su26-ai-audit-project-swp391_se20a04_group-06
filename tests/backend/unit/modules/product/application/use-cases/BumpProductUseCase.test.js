"use strict";
describe("Smoke Test: modules/product/application/use-cases/BumpProductUseCase.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../backend/src/modules/product/application/use-cases/BumpProductUseCase");
        expect(module).toBeDefined();
    });
});
