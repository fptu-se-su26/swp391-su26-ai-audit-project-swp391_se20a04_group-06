"use strict";
describe("Smoke Test: modules/iam/infrastructure/external-services/CloudinaryImageUploader.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../backend/src/modules/iam/infrastructure/external-services/CloudinaryImageUploader");
        expect(module).toBeDefined();
    });
});
