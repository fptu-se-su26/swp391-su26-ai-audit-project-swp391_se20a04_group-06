describe("Smoke Test: middlewares/errorHandler.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/middlewares/errorHandler");
    expect(module).toBeDefined();
  });
});
