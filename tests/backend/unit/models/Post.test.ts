describe("Smoke Test: models/Post.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/models/Post");
    expect(module).toBeDefined();
  });
});
