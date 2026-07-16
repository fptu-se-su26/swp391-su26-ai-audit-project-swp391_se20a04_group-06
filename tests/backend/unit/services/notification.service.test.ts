describe("Smoke Test: services/notification.service.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/services/notification.service");
    expect(module).toBeDefined();
  });
});
