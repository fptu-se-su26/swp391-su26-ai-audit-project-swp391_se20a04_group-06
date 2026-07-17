"use strict";
describe("Smoke Test: validations/boatLog.validation.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/validations/boatLog.validation");
        expect(module).toBeDefined();
    });
});
