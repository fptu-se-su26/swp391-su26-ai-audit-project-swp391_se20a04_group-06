"use strict";
describe("Smoke Test: modules/boat-log/application/use-cases/DeleteBoatLogUseCase.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../backend/src/modules/boat-log/application/use-cases/DeleteBoatLogUseCase");
        expect(module).toBeDefined();
    });
});
