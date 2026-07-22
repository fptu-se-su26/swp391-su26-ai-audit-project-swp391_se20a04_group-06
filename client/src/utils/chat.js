export function normalizeConversation(conversation) {
  if (!conversation) {
    return {
      id: "empty",
      partnerId: "",
      partnerName: "Người dùng",
      productId: "",
      messages: [],
    };
  }
  const partnerId = String(
    conversation.otherUserId || conversation.partnerId || "",
  );
  const productId = String(conversation.productId || "");

  return {
    ...conversation,
    id: String(
      conversation.id || (productId ? `${productId}:${partnerId}` : partnerId),
    ),
    partnerId,
    partnerName:
      conversation.otherUserName ||
      conversation.partnerName ||
      "Người dùng",
    productId,
    messages: Array.isArray(conversation.messages) ? conversation.messages : [],
  };
}

export function mergeConversations(currentThreads, incomingThreads) {
  const currentSafe = Array.isArray(currentThreads) ? currentThreads.filter(Boolean) : [];
  const incomingSafe = Array.isArray(incomingThreads) ? incomingThreads.filter(Boolean) : [];

  const incomingIds = new Set(incomingSafe.map((thread) => thread.id));
  const currentById = new Map(
    currentSafe.map((thread) => [thread.id, thread]),
  );

  const localThreads = currentSafe.filter(
    (thread) => !incomingIds.has(thread.id),
  );
  const mergedIncoming = incomingSafe.map((thread) => {
    const current = currentById.get(thread.id);
    if (!current) return thread;

    return {
      ...current,
      ...thread,
      messages: Array.isArray(current.messages) && current.messages.length
        ? current.messages
        : Array.isArray(thread.messages) ? thread.messages : [],
    };
  });

  return [...localThreads, ...mergedIncoming];
}
