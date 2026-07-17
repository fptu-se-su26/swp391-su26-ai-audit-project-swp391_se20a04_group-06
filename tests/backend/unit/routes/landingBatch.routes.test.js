"use strict";
describe("Smoke Test: routes/landingBatch.routes.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/routes/landingBatch.routes");
        expect(module).toBeDefined();
    });
});
