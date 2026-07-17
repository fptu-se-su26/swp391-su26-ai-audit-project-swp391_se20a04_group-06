"use strict";
describe("Smoke Test: config/cloudinary.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../backend/src/config/cloudinary");
        expect(module).toBeDefined();
    });
});
