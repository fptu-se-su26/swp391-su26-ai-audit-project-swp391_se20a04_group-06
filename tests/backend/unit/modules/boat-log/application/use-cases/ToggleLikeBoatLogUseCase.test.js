"use strict";
describe("Smoke Test: modules/boat-log/application/use-cases/ToggleLikeBoatLogUseCase.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../backend/src/modules/boat-log/application/use-cases/ToggleLikeBoatLogUseCase");
        expect(module).toBeDefined();
    });
});
