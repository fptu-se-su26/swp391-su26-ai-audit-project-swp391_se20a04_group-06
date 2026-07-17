"use strict";
describe("Smoke Test: utils/pagination.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/utils/pagination");
        expect(module).toBeDefined();
    });
});
