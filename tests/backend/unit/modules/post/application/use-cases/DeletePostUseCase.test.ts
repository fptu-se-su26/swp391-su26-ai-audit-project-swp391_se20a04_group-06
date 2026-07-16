describe("Smoke Test: modules/post/application/use-cases/DeletePostUseCase.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../../../../backend/src/modules/post/application/use-cases/DeletePostUseCase");
    expect(module).toBeDefined();
  });
});
