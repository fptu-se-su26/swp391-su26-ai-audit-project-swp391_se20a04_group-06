"use strict";
describe("Smoke Test: routes/chatbot.routes.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/routes/chatbot.routes");
        expect(module).toBeDefined();
    });
});
