describe("Smoke Test: routes/payment.routes.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/routes/payment.routes");
    expect(module).toBeDefined();
  });
});
