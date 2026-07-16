describe("Smoke Test: cron.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../backend/src/cron");
    expect(module).toBeDefined();
  });
});
