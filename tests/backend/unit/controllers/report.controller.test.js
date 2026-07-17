"use strict";
describe("Smoke Test: controllers/report.controller.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/controllers/report.controller");
        expect(module).toBeDefined();
    });
});
