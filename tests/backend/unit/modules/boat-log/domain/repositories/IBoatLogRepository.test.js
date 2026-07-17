"use strict";
describe("Smoke Test: modules/boat-log/domain/repositories/IBoatLogRepository.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../backend/src/modules/boat-log/domain/repositories/IBoatLogRepository");
        expect(module).toBeDefined();
    });
});
