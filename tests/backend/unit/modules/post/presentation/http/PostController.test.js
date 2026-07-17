"use strict";
describe("Smoke Test: modules/post/presentation/http/PostController.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../backend/src/modules/post/presentation/http/PostController");
        expect(module).toBeDefined();
    });
});
