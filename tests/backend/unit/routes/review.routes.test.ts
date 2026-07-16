describe("Smoke Test: routes/review.routes.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/routes/review.routes");
    expect(module).toBeDefined();
  });
});
