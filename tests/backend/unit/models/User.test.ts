describe("Smoke Test: models/User.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/models/User");
    expect(module).toBeDefined();
  });
});
