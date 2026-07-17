"use strict";
describe("Smoke Test: routes/notification.routes.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/routes/notification.routes");
        expect(module).toBeDefined();
    });
});
