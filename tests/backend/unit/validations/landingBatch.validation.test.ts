describe("Smoke Test: validations/landingBatch.validation.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/validations/landingBatch.validation");
    expect(module).toBeDefined();
  });
});
