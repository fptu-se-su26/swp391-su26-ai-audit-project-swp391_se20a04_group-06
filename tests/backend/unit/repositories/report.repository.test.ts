describe("Smoke Test: repositories/report.repository.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/repositories/report.repository");
    expect(module).toBeDefined();
  });
});
