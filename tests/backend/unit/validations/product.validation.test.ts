describe("Smoke Test: validations/product.validation.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/validations/product.validation");
    expect(module).toBeDefined();
  });
});
