describe("Smoke Test: models/LandingBatch.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/models/LandingBatch");
    expect(module).toBeDefined();
  });
});
