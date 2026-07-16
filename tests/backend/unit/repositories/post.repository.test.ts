describe("Smoke Test: repositories/post.repository.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/repositories/post.repository");
    expect(module).toBeDefined();
  });
});
