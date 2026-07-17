"use strict";
describe("Smoke Test: modules/iam/application/event-handlers/OnUserPremiumUpgraded.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../backend/src/modules/iam/application/event-handlers/OnUserPremiumUpgraded");
        expect(module).toBeDefined();
    });
});
