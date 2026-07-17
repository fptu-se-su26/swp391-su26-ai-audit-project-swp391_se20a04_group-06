"use strict";
describe("Smoke Test: config/redis.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/config/redis");
        expect(module).toBeDefined();
    });
});
