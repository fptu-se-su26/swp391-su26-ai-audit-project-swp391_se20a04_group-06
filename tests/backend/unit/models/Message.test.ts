describe("Smoke Test: models/Message.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/models/Message");
    expect(module).toBeDefined();
  });
});
