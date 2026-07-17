"use strict";
describe("Smoke Test: modules/post/application/use-cases/DeleteCommentUseCase.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../backend/src/modules/post/application/use-cases/DeleteCommentUseCase");
        expect(module).toBeDefined();
    });
});
