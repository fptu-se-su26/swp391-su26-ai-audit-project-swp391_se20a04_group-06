describe("Smoke Test: utils/logger.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/utils/logger");
    expect(module).toBeDefined();
  });
});
