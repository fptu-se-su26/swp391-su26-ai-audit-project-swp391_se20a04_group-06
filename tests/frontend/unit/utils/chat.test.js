import { describe, expect, it } from "vitest";
import { mergeConversations, normalizeConversation } from "../../../../client/src/utils/chat";

describe("chat utilities", () => {
  it("normalizes backend conversation fields and generates a stable id", () => {
    const result = normalizeConversation({
      otherUserId: 12,
      otherUserName: "Ngư dân A",
      productId: 99,
    });

    expect(result).toMatchObject({
      id: "99:12",
      partnerId: "12",
      partnerName: "Ngư dân A",
      productId: "99",
      messages: [],
    });
  });

  it("keeps local messages while refreshing server metadata", () => {
    const current = [{ id: "p:u", partnerName: "Cũ", messages: [{ id: "m1" }] }];
    const incoming = [{ id: "p:u", partnerName: "Mới", messages: [] }];

    expect(mergeConversations(current, incoming)).toEqual([
      { id: "p:u", partnerName: "Mới", messages: [{ id: "m1" }] },
    ]);
  });

  it("keeps route-created local threads before fetched conversations", () => {
    const current = [{ id: "local" }, { id: "server" }];
    const incoming = [{ id: "server", partnerName: "Server" }];
    expect(mergeConversations(current, incoming).map((item) => item.id)).toEqual([
      "local",
      "server",
    ]);
  });
});
