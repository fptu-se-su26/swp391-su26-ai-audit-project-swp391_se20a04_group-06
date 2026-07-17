"use strict";
describe("Smoke Test: modules/iam/domain/repositories/IUserRepository.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../backend/src/modules/iam/domain/repositories/IUserRepository");
        expect(module).toBeDefined();
    });
});
