describe("Smoke Test: controllers/user.controller.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/controllers/user.controller");
    expect(module).toBeDefined();
  });
});
