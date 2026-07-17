"use strict";
describe("Smoke Test: modules/iam/domain/events/UserPremiumUpgradedEvent.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../backend/src/modules/iam/domain/events/UserPremiumUpgradedEvent");
        expect(module).toBeDefined();
    });
});
