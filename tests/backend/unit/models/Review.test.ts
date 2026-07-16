describe("Smoke Test: models/Review.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/models/Review");
    expect(module).toBeDefined();
  });
});
