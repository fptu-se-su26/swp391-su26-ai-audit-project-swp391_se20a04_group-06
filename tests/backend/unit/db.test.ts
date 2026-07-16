describe("Smoke Test: db.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../backend/src/db");
    expect(module).toBeDefined();
  });
});
