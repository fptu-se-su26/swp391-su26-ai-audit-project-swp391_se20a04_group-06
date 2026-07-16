describe("Smoke Test: app.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../backend/src/app");
    expect(module).toBeDefined();
  });
});
