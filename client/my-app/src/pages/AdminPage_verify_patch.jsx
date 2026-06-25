/**
 * AdminPage_verify_patch.jsx
 *
 * Thêm nút "Xác minh / Thu hồi" vào bảng Users trong AdminPage.
 *
 * Tìm trong AdminPage.jsx chỗ render hàng user trong bảng,
 * thêm nút này vào cột Actions bên cạnh nút Khoá/Mở khoá.
 */

import React, { useState } from "react";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { VerifiedBadge } from "../components/VerifiedBadge";

/**
 * Thêm hàm này vào AdminPage component:
 */
export function useVerifyUser(users, setUsers) {
  const [verifyingId, setVerifyingId] = useState(null);

  const toggleVerify = async (userId) => {
    setVerifyingId(userId);
    try {
      const res = await api(`/admin/users/${userId}/verify`, { method: "PATCH" });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isVerified: res.isVerified } : u))
      );
      // Toast/alert optional:
      // alert(res.message);
    } catch (e) {
      alert(e.message);
    } finally {
      setVerifyingId(null);
    }
  };

  return { toggleVerify, verifyingId };
}

/**
 * Render trong bảng user (thêm vào cột hiện có):
 *
 * <td>
 *   {user.isVerified && <VerifiedBadge showLabel />}
 * </td>
 * <td>
 *   <button
 *     onClick={() => toggleVerify(user.id)}
 *     disabled={verifyingId === user.id}
 *     style={{
 *       background: user.isVerified ? '#EF4444' : '#0EA5E9',
 *       color: '#fff',
 *       border: 'none',
 *       padding: '4px 10px',
 *       borderRadius: 6,
 *       cursor: 'pointer',
 *       fontSize: 12,
 *       fontWeight: 700,
 *       fontFamily: 'inherit',
 *       marginLeft: 4,
 *     }}
 *   >
 *     {verifyingId === user.id
 *       ? '...'
 *       : user.isVerified
 *       ? '✗ Thu hồi'
 *       : '✓ Xác minh'}
 *   </button>
 * </td>
 */

/**
 * ─── Full inline component để copy vào AdminPage ───
 * Đây là UserRow component hoàn chỉnh với badge + 2 nút:
 */
export function AdminUserRow({ user, onToggleActive, onToggleVerify, verifyingId, togglingId }) {
  return (
    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
      <td style={{ padding: "10px 12px", fontSize: 13 }}>
        <div style={{ fontWeight: 600 }}>{user.name}</div>
        <div style={{ fontSize: 11, color: C.muted }}>{user.phone}</div>
      </td>
      <td style={{ padding: "10px 12px", fontSize: 13 }}>
        <span style={{
          background: user.role === "Admin" ? "#7C3AED" : C.ocean,
          color: "#fff", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700,
        }}>
          {user.role}
        </span>
      </td>
      <td style={{ padding: "10px 12px", fontSize: 13, textAlign: "center" }}>
        {user.postCount}
      </td>
      <td style={{ padding: "10px 12px", fontSize: 13 }}>
        {/* Badge xác minh */}
        {user.isVerified && <VerifiedBadge showLabel />}
      </td>
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {/* Nút khoá/mở khoá */}
          <button
            onClick={() => onToggleActive(user.id)}
            disabled={togglingId === user.id}
            style={{
              background: user.isActive ? "#EF4444" : "#22C55E",
              color: "#fff", border: "none", padding: "4px 10px",
              borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700,
              fontFamily: "inherit",
            }}
          >
            {togglingId === user.id ? "..." : user.isActive ? "Khoá" : "Mở khoá"}
          </button>

          {/* Nút xác minh — chỉ cho non-Admin */}
          {user.role !== "Admin" && (
            <button
              onClick={() => onToggleVerify(user.id)}
              disabled={verifyingId === user.id}
              style={{
                background: user.isVerified ? "#64748B" : "#0EA5E9",
                color: "#fff", border: "none", padding: "4px 10px",
                borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700,
                fontFamily: "inherit",
              }}
            >
              {verifyingId === user.id
                ? "..."
                : user.isVerified
                ? "✗ Thu hồi"
                : "✓ Xác minh"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
