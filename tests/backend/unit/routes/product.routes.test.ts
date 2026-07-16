describe("Smoke Test: routes/product.routes.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/routes/product.routes");
    expect(module).toBeDefined();
  });
});
