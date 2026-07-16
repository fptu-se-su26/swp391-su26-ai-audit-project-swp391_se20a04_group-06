describe("Smoke Test: modules/recipe/application/use-cases/ToggleLikeRecipeUseCase.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../../../../backend/src/modules/recipe/application/use-cases/ToggleLikeRecipeUseCase");
    expect(module).toBeDefined();
  });
});
