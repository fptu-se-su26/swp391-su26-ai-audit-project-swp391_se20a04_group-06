"use strict";
describe("Smoke Test: modules/iam/infrastructure/persistence/mongoose/mappers/UserMapper.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../../../backend/src/modules/iam/infrastructure/persistence/mongoose/mappers/UserMapper");
        expect(module).toBeDefined();
    });
});
