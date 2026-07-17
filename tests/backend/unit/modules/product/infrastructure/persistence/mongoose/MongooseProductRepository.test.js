"use strict";
describe("Smoke Test: modules/product/infrastructure/persistence/mongoose/MongooseProductRepository.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../../backend/src/modules/product/infrastructure/persistence/mongoose/MongooseProductRepository");
        expect(module).toBeDefined();
    });
});
