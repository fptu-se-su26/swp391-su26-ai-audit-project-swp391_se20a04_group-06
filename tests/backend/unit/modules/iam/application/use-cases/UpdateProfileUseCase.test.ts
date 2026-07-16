describe("Smoke Test: modules/iam/application/use-cases/UpdateProfileUseCase.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../../../../backend/src/modules/iam/application/use-cases/UpdateProfileUseCase");
    expect(module).toBeDefined();
  });
});
