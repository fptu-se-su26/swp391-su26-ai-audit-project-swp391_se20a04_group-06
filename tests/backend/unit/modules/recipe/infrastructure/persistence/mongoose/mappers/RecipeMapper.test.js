"use strict";
describe("Smoke Test: modules/recipe/infrastructure/persistence/mongoose/mappers/RecipeMapper.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../../../backend/src/modules/recipe/infrastructure/persistence/mongoose/mappers/RecipeMapper");
        expect(module).toBeDefined();
    });
});
