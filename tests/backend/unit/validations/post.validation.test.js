"use strict";
describe("Smoke Test: validations/post.validation.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/validations/post.validation");
        expect(module).toBeDefined();
    });
});
