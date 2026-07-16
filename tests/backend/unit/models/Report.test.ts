describe("Smoke Test: models/Report.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/models/Report");
    expect(module).toBeDefined();
  });
});
