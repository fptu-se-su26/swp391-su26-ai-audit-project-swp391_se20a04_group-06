import { canSignalProductCall } from "./callAuthorization";

describe("WebRTC signaling authorization", () => {
  const sellerId = "seller";
  const buyerId = "buyer";

  it("allows a buyer to call the product seller", () => {
    expect(canSignalProductCall(sellerId, buyerId, sellerId)).toBe(true);
  });

  it("allows the seller to call a buyer", () => {
    expect(canSignalProductCall(sellerId, sellerId, buyerId)).toBe(true);
  });

  it("rejects unrelated and self calls", () => {
    expect(canSignalProductCall(sellerId, "stranger-a", "stranger-b")).toBe(false);
    expect(canSignalProductCall(sellerId, sellerId, sellerId)).toBe(false);
  });
});
