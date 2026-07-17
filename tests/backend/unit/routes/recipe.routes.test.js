"use strict";
describe("Smoke Test: routes/recipe.routes.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/routes/recipe.routes");
        expect(module).toBeDefined();
    });
});
