describe("Smoke Test: modules/boat-log/infrastructure/persistence/mongoose/mappers/BoatLogMapper.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../../../../../../backend/src/modules/boat-log/infrastructure/persistence/mongoose/mappers/BoatLogMapper");
    expect(module).toBeDefined();
  });
});
