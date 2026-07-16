describe("Smoke Test: modules/product/domain/value-objects/GPSCoordinates.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../../../../backend/src/modules/product/domain/value-objects/GPSCoordinates");
    expect(module).toBeDefined();
  });
});
