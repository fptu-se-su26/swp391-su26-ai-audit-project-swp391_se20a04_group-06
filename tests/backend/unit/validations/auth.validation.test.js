"use strict";
describe("Smoke Test: validations/auth.validation.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/validations/auth.validation");
        expect(module).toBeDefined();
    });
});
