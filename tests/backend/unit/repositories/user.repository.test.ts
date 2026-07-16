describe("Smoke Test: repositories/user.repository.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/repositories/user.repository");
    expect(module).toBeDefined();
  });
});
