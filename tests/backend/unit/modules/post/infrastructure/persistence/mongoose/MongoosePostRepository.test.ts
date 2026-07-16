describe("Smoke Test: modules/post/infrastructure/persistence/mongoose/MongoosePostRepository.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../../../../../backend/src/modules/post/infrastructure/persistence/mongoose/MongoosePostRepository");
    expect(module).toBeDefined();
  });
});
