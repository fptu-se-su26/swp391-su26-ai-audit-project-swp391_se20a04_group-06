describe("Smoke Test: controllers/follow.controller.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/controllers/follow.controller");
    expect(module).toBeDefined();
  });
});
