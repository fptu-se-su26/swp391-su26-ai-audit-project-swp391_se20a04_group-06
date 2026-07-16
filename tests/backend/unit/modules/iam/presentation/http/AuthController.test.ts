describe("Smoke Test: modules/iam/presentation/http/AuthController.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../../../../backend/src/modules/iam/presentation/http/AuthController");
    expect(module).toBeDefined();
  });
});
