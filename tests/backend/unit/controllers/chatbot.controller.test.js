"use strict";
describe("Smoke Test: controllers/chatbot.controller.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/controllers/chatbot.controller");
        expect(module).toBeDefined();
    });
});
