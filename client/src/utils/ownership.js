export function getIdentityId(value) {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value.id || value._id || value.userId || "");
  }
  return String(value);
}

export function canManageOwnedContent(user, owner) {
  if (!user) return false;
  if (String(user.role || "").toLowerCase() === "admin") return true;

  const currentUserId = getIdentityId(user);
  const ownerId = getIdentityId(owner);
  return Boolean(currentUserId && ownerId && currentUserId === ownerId);
}
