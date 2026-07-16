describe("Smoke Test: helpers/response.helper.ts", () => {
  it("should compile and load the module successfully", () => {
    const module = require("../../../../backend/src/helpers/response.helper");
    expect(module).toBeDefined();
  });
});
