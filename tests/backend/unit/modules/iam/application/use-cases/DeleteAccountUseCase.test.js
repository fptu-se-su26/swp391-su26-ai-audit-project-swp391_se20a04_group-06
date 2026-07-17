"use strict";
describe("Smoke Test: modules/iam/application/use-cases/DeleteAccountUseCase.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../backend/src/modules/iam/application/use-cases/DeleteAccountUseCase");
        expect(module).toBeDefined();
    });
});
