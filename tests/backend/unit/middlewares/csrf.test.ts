describe("Smoke Test: middlewares/csrf.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/middlewares/csrf");
    expect(module).toBeDefined();
  });
});
