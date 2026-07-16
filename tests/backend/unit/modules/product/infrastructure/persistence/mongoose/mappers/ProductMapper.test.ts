describe("Smoke Test: modules/product/infrastructure/persistence/mongoose/mappers/ProductMapper.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../../../../../../backend/src/modules/product/infrastructure/persistence/mongoose/mappers/ProductMapper");
    expect(module).toBeDefined();
  });
});
