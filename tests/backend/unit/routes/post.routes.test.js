"use strict";
describe("Smoke Test: routes/post.routes.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/routes/post.routes");
        expect(module).toBeDefined();
    });
});
