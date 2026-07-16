describe("Smoke Test: modules/recipe/application/use-cases/CreateRecipeUseCase.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../../../../backend/src/modules/recipe/application/use-cases/CreateRecipeUseCase");
    expect(module).toBeDefined();
  });
});
