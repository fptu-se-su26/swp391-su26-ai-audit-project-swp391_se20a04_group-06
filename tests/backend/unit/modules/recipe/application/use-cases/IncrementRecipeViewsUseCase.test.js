"use strict";
describe("Smoke Test: modules/recipe/application/use-cases/IncrementRecipeViewsUseCase.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../backend/src/modules/recipe/application/use-cases/IncrementRecipeViewsUseCase");
        expect(module).toBeDefined();
    });
});
