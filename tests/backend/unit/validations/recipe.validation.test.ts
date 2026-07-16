describe("Smoke Test: validations/recipe.validation.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/validations/recipe.validation");
    expect(module).toBeDefined();
  });
});
