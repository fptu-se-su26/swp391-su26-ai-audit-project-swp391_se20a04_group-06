"use strict";
describe("Smoke Test: utils/cloudinary.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/utils/cloudinary");
        expect(module).toBeDefined();
    });
});
