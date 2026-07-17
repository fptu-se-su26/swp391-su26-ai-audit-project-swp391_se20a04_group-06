"use strict";
describe("Smoke Test: routes/admin.routes.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/routes/admin.routes");
        expect(module).toBeDefined();
    });
});
