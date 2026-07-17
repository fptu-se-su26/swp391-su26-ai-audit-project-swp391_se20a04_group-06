"use strict";
describe("Smoke Test: models/Recipe.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/models/Recipe");
        expect(module).toBeDefined();
    });
});
