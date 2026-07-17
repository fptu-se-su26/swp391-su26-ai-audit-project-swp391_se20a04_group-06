"use strict";
describe("Smoke Test: models/BroadcastLog.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/models/BroadcastLog");
        expect(module).toBeDefined();
    });
});
