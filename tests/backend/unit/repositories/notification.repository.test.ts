describe("Smoke Test: repositories/notification.repository.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/repositories/notification.repository");
    expect(module).toBeDefined();
  });
});
