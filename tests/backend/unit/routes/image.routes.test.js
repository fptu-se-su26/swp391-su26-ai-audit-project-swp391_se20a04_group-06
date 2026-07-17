"use strict";
describe("Smoke Test: routes/image.routes.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/routes/image.routes");
        expect(module).toBeDefined();
    });
});
