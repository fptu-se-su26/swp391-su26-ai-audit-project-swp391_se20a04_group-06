describe("Smoke Test: modules/recipe/presentation/http/RecipeController.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../../../../backend/src/modules/recipe/presentation/http/RecipeController");
    expect(module).toBeDefined();
  });
});
