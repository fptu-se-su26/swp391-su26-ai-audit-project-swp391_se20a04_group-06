describe("Smoke Test: controllers/admin.controller.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/controllers/admin.controller");
    expect(module).toBeDefined();
  });
});
