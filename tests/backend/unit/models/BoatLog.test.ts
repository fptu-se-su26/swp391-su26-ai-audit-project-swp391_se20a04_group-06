describe("Smoke Test: models/BoatLog.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/models/BoatLog");
    expect(module).toBeDefined();
  });
});
