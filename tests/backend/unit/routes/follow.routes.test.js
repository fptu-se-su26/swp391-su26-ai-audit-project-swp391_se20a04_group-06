"use strict";
describe("Smoke Test: routes/follow.routes.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/routes/follow.routes");
        expect(module).toBeDefined();
    });
});
