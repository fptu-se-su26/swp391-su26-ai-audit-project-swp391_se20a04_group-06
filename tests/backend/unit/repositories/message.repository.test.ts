describe("Smoke Test: repositories/message.repository.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/repositories/message.repository");
    expect(module).toBeDefined();
  });
});
