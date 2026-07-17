"use strict";
describe("Smoke Test: modules/post/domain/repositories/IPostRepository.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../backend/src/modules/post/domain/repositories/IPostRepository");
        expect(module).toBeDefined();
    });
});
