describe("Smoke Test: controllers/favorite.controller.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/controllers/favorite.controller");
    expect(module).toBeDefined();
  });
});
