"use strict";
describe("Smoke Test: modules/post/application/use-cases/AddCommentUseCase.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../backend/src/modules/post/application/use-cases/AddCommentUseCase");
        expect(module).toBeDefined();
    });
});
