describe("Smoke Test: routes/auth.routes.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/routes/auth.routes");
    expect(module).toBeDefined();
  });
});
