"use strict";
describe("Smoke Test: validations/report.validation.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/validations/report.validation");
        expect(module).toBeDefined();
    });
});
