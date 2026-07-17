"use strict";
describe("Smoke Test: errors/HttpError.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/errors/HttpError");
        expect(module).toBeDefined();
    });
});
