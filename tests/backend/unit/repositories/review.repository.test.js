"use strict";
describe("Smoke Test: repositories/review.repository.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/repositories/review.repository");
        expect(module).toBeDefined();
    });
});
