export function normalizeConversation(conversation) {
  const partnerId = String(
    conversation.otherUserId || conversation.partnerId || "",
  );
  const productId = String(conversation.productId || "");

  return {
    ...conversation,
    id: String(conversation.id || `${productId}:${partnerId}`),
    partnerId,
    partnerName:
      conversation.otherUserName ||
      conversation.partnerName ||
      "Người dùng",
    productId,
    messages: conversation.messages || [],
  };
}

export function mergeConversations(currentThreads, incomingThreads) {
  const incomingIds = new Set(incomingThreads.map((thread) => thread.id));
  const currentById = new Map(
    currentThreads.map((thread) => [thread.id, thread]),
  );

  const localThreads = currentThreads.filter(
    (thread) => !incomingIds.has(thread.id),
  );
  const mergedIncoming = incomingThreads.map((thread) => {
    const current = currentById.get(thread.id);
    if (!current) return thread;

    return {
      ...current,
      ...thread,
      messages: current.messages?.length
        ? current.messages
        : thread.messages,
    };
  });

  // Route-created threads stay first while the inbox request resolves.
  return [...localThreads, ...mergedIncoming];
}
