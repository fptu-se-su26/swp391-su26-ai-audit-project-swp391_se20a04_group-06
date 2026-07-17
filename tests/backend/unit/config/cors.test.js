"use strict";
describe("Smoke Test: config/cors.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/config/cors");
        expect(module).toBeDefined();
    });
});
