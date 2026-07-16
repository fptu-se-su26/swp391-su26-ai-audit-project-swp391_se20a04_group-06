describe("Smoke Test: modules/post/application/use-cases/CreatePostUseCase.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../../../../backend/src/modules/post/application/use-cases/CreatePostUseCase");
    expect(module).toBeDefined();
  });
});
