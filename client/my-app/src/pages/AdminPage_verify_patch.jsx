import React, { useState } from "react";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { useToast } from "../context/ToastContext"; // ← NEW

export function useVerifyUser(users, setUsers) {
  const toast = useToast(); // ← NEW
  const [verifyingId, setVerifyingId] = useState(null);

  const toggleVerify = async (userId) => {
    setVerifyingId(userId);
    try {
      const res = await api(`/admin/users/${userId}/verify`, {
        method: "PATCH",
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isVerified: res.isVerified } : u,
        ),
      );
      toast.success(
        res.message || "Đã cập nhật trạng thái xác minh tài khoản thành công!",
      );
    } catch (e) {
      toast.error(e.message);
    } finally {
      setVerifyingId(null);
    }
  };

  return { toggleVerify, verifyingId };
}

export function AdminUserRow({
  user,
  onToggleActive,
  onToggleVerify,
  verifyingId,
  togglingId,
}) {
  return (
    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
      <td style={{ padding: "10px 12px", fontSize: 13 }}>
        <div style={{ fontWeight: 600 }}>{user.name}</div>
        <div style={{ fontSize: 11, color: C.muted }}>{user.email}</div>
      </td>
      <td style={{ padding: "10px 12px", fontSize: 13 }}>
        <span
          style={{
            background: user.role === "Admin" ? "#7C3AED" : C.ocean,
            color: "#fff",
            padding: "2px 8px",
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {user.role}
        </span>
      </td>
      <td style={{ padding: "10px 12px", fontSize: 13, textAlign: "center" }}>
        {user.postCount}
      </td>
      <td style={{ padding: "10px 12px", fontSize: 13 }}>
        {user.isVerified && <VerifiedBadge showLabel />}
      </td>
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => onToggleActive(user.id)}
            disabled={togglingId === user.id}
            style={{
              background: user.isActive ? "#EF4444" : "#22C55E",
              color: "#fff",
              border: "none",
              padding: "4px 10px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "inherit",
            }}
          >
            {togglingId === user.id
              ? "..."
              : user.isActive
                ? "Khoá"
                : "Mở khoá"}
          </button>

          {user.role !== "Admin" && (
            <button
              onClick={() => onToggleVerify(user.id)}
              disabled={verifyingId === user.id}
              style={{
                background: user.isVerified ? "#64748B" : "#0EA5E9",
                color: "#fff",
                border: "none",
                padding: "4px 10px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
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
