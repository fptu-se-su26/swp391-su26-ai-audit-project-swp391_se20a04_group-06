describe("Smoke Test: routes/report.routes.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/routes/report.routes");
    expect(module).toBeDefined();
  });
});
