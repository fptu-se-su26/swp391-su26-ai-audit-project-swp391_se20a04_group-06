"use strict";
describe("Smoke Test: modules/boat-log/presentation/http/BoatLogController.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../backend/src/modules/boat-log/presentation/http/BoatLogController");
        expect(module).toBeDefined();
    });
});
