describe("Smoke Test: modules/product/application/use-cases/CreateProductUseCase.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../../../../backend/src/modules/product/application/use-cases/CreateProductUseCase");
    expect(module).toBeDefined();
  });
});
