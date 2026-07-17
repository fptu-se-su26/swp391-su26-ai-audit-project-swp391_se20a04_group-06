"use strict";
describe("Smoke Test: config/cookie.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/config/cookie");
        expect(module).toBeDefined();
    });
});
