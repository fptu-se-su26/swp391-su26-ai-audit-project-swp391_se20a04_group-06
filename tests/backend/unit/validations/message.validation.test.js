"use strict";
describe("Smoke Test: validations/message.validation.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/validations/message.validation");
        expect(module).toBeDefined();
    });
});
