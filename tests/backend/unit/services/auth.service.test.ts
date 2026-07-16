describe("Smoke Test: services/auth.service.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/services/auth.service");
    expect(module).toBeDefined();
  });
});
