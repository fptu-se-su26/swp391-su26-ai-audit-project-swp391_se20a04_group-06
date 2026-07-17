"use strict";
describe("Smoke Test: modules/post/application/use-cases/ToggleLikePostUseCase.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../backend/src/modules/post/application/use-cases/ToggleLikePostUseCase");
        expect(module).toBeDefined();
    });
});
