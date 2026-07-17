"use strict";
describe("Smoke Test: repositories/broadcastlog.repository.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/repositories/broadcastlog.repository");
        expect(module).toBeDefined();
    });
});
