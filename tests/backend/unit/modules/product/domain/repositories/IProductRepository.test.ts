describe("Smoke Test: modules/product/domain/repositories/IProductRepository.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../../../../backend/src/modules/product/domain/repositories/IProductRepository");
    expect(module).toBeDefined();
  });
});
