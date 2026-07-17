"use strict";
describe("Smoke Test: routes/message.routes.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/routes/message.routes");
        expect(module).toBeDefined();
    });
});
