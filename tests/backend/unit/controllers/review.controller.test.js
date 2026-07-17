"use strict";
describe("Smoke Test: controllers/review.controller.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/controllers/review.controller");
        expect(module).toBeDefined();
    });
});
