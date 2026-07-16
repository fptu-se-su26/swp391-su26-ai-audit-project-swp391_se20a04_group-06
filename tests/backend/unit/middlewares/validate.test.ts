describe("Smoke Test: middlewares/validate.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/middlewares/validate");
    expect(module).toBeDefined();
  });
});
