describe("Smoke Test: config/swagger.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/config/swagger");
    expect(module).toBeDefined();
  });
});
