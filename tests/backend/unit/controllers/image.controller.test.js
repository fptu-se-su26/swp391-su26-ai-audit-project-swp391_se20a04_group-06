"use strict";
describe("Smoke Test: controllers/image.controller.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/controllers/image.controller");
        expect(module).toBeDefined();
    });
});
