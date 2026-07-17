"use strict";
describe("Smoke Test: repositories/recipe.repository.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/repositories/recipe.repository");
        expect(module).toBeDefined();
    });
});
