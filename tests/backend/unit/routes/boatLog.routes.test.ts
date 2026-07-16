describe("Smoke Test: routes/boatLog.routes.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/routes/boatLog.routes");
    expect(module).toBeDefined();
  });
});
