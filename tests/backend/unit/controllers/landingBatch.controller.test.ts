describe("Smoke Test: controllers/landingBatch.controller.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/controllers/landingBatch.controller");
    expect(module).toBeDefined();
  });
});
