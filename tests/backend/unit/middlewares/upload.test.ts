describe("Smoke Test: middlewares/upload.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/middlewares/upload");
    expect(module).toBeDefined();
  });
});
