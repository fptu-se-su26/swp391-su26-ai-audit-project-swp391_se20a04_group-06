describe("Smoke Test: validations/review.validation.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/validations/review.validation");
    expect(module).toBeDefined();
  });
});
