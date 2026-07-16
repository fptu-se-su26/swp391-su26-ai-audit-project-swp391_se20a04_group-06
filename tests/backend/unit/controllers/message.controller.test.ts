describe("Smoke Test: controllers/message.controller.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/controllers/message.controller");
    expect(module).toBeDefined();
  });
});
