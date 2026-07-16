describe("Smoke Test: modules/recipe/domain/repositories/IRecipeRepository.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../../../../backend/src/modules/recipe/domain/repositories/IRecipeRepository");
    expect(module).toBeDefined();
  });
});
