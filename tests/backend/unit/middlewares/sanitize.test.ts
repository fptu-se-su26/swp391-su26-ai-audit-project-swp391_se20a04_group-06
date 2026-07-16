describe("Smoke Test: middlewares/sanitize.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/middlewares/sanitize");
    expect(module).toBeDefined();
  });
});
