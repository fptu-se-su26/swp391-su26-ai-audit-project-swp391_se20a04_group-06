"use strict";
describe("Smoke Test: models/Notification.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/models/Notification");
        expect(module).toBeDefined();
    });
});
