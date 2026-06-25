/**
 * auth.controller.ts — patch notes
 *
 * Thêm `isVerified` vào SELECT trong:
 *   1. GET /auth/me
 *   2. POST /auth/login (response trả về)
 *   3. POST /auth/register (response trả về)
 *
 * ─── THAY ĐỔI TRONG getMe() ───
 *
 * Tìm query SELECT trong getMe và đổi thành:
 *
 *   SELECT UserID AS id, Name AS name, Phone AS phone,
 *          Role AS role, IsActive AS isActive,
 *          IsVerified AS isVerified             ← THÊM DÒNG NÀY
 *   FROM User WHERE UserID = ?
 *
 * ─── THAY ĐỔI TRONG login() / register() ───
 *
 * Trong response JSON trả về user object, thêm:
 *   isVerified: user.IsVerified ?? false,
 *
 * Ví dụ:
 *   return res.json({
 *     token,
 *     user: {
 *       id: user.UserID,
 *       name: user.Name,
 *       phone: user.Phone,
 *       role: user.Role,
 *       isVerified: !!user.IsVerified,    ← THÊM
 *     }
 *   });
 */

export const AUTH_CONTROLLER_PATCH = `
// Trong getMe query:
SELECT UserID AS id, Name AS name, Phone AS phone,
       Role AS role, IsActive AS isActive, IsVerified AS isVerified
FROM User WHERE UserID = ?

// Trong login/register response:
user: {
  id: row.UserID,
  name: row.Name,
  phone: row.Phone,
  role: row.Role,
  isVerified: !!row.IsVerified,
}
`;
