"use strict";
describe("Smoke Test: repositories/boatlog.repository.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/repositories/boatlog.repository");
        expect(module).toBeDefined();
    });
});
