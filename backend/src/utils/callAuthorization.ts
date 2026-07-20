/**
 * Chỉ người bán của sản phẩm và người đang trò chuyện với họ mới được
 * trao đổi signaling. Hai đầu cuộc gọi phải là hai tài khoản khác nhau.
 */
export function canSignalProductCall(
  sellerId: string | undefined,
  callerId: string,
  recipientId: string,
): boolean {
  if (!sellerId || !callerId || !recipientId || callerId === recipientId) {
    return false;
  }
  return sellerId === callerId || sellerId === recipientId;
}
