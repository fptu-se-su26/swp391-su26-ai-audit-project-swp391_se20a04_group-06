"use strict";
describe("Smoke Test: modules/recipe/infrastructure/persistence/mongoose/MongooseRecipeRepository.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../../backend/src/modules/recipe/infrastructure/persistence/mongoose/MongooseRecipeRepository");
        expect(module).toBeDefined();
    });
});
