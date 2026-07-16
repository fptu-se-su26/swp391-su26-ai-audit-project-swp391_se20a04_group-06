describe("Smoke Test: controllers/notification.controller.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/controllers/notification.controller");
    expect(module).toBeDefined();
  });
});
