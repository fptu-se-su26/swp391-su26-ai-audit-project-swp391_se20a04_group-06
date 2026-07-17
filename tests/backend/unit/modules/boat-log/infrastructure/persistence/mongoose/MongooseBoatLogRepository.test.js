"use strict";
describe("Smoke Test: modules/boat-log/infrastructure/persistence/mongoose/MongooseBoatLogRepository.ts", () => {
    it("should compile and load the module successfully", () => {
        const module = require("../../../../../../../../backend/src/modules/boat-log/infrastructure/persistence/mongoose/MongooseBoatLogRepository");
        expect(module).toBeDefined();
    });
});
