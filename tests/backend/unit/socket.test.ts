describe("Smoke Test: socket.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../backend/src/socket");
    expect(module).toBeDefined();
  });
});
