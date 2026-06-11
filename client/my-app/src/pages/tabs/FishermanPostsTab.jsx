import React, { useState } from "react";
import { C } from "../../utils/theme";
import { useApiFetch } from "../../hooks/useApiFetch";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export function FishermanPostsTab({ sellerId }) {
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading } = useApiFetch(
    `/fishermen/${sellerId}/posts?limit=10`,
    [sellerId]
  );
  const [activePost, setActivePost] = useState(null);
  const [likingId, setLikingId] = useState(null);

  const posts = data?.posts ?? [];

  const handleLike = async (postId, e) => {
    e.stopPropagation();
    if (!user) { toast.warn("Vui lòng đăng nhập để thích bài viết"); return; }
    setLikingId(postId);
    try {
      await api(`/posts/${postId}/like`, { method: "POST" });
    } catch { /* silent */ }
    finally { setLikingId(null); }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer" style={{ height: 120, borderRadius: 12 }} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px",
        background: C.white, borderRadius: 16, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
        <div style={{ fontWeight: 700, color: C.dark }}>Chưa có bài đăng cộng đồng</div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {posts.map((post) => (
          <div
            key={post._id}
            onClick={() => setActivePost(post)}
            style={{
              background: C.white, borderRadius: 14,
              border: `1px solid ${C.border}`, padding: "18px 20px",
              cursor: "pointer", transition: "box-shadow 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)"}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
          >
            <div style={{ fontWeight: 700, fontSize: 15, color: C.dark, marginBottom: 6 }}>
              {post.title}
            </div>
            <div style={{
              fontSize: 13, color: C.muted,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              overflow: "hidden", marginBottom: 10, lineHeight: 1.55,
            }}>
              {post.content}
            </div>

            {post.images?.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                {post.images.slice(0, 4).map((img, i) => (
                  <img key={i} src={img} alt=""
                    style={{ width: 64, height: 64, objectFit: "cover",
                      borderRadius: 8, border: `1px solid ${C.border}` }} />
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.muted, alignItems: "center" }}>
              <button
                onClick={(e) => handleLike(post._id, e)}
                disabled={likingId === post._id}
                style={{ background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}
              >
                ❤️ {post.likes?.length ?? 0}
              </button>
              <span>💬 {post.comments?.length ?? 0}</span>
              <span>👁️ {post.viewCount ?? 0}</span>
              <span style={{ marginLeft: "auto" }}>
                {new Date(post.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal xem đầy đủ bài đăng */}
      {activePost && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 9999, display: "flex", alignItems: "center",
            justifyContent: "center", padding: 16 }}
          onClick={() => setActivePost(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: C.white, borderRadius: 20, padding: 28,
              maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto",
              boxShadow: "0 24px 48px rgba(0,0,0,0.25)", position: "relative" }}
          >
            <button onClick={() => setActivePost(null)} style={{
              position: "absolute", top: 16, right: 16, background: "none",
              border: "none", fontSize: 22, cursor: "pointer", color: C.muted,
            }}>×</button>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.dark, marginBottom: 12, marginTop: 0 }}>
              {activePost.title}
            </h3>
            <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7,
              whiteSpace: "pre-line", marginBottom: 16 }}>
              {activePost.content}
            </p>
            {activePost.images?.length > 0 && (
              <div style={{ display: "grid",
                gridTemplateColumns: activePost.images.length === 1 ? "1fr" : "repeat(2, 1fr)",
                gap: 8, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
                {activePost.images.map((img, i) => (
                  <img key={i} src={img} alt=""
                    style={{ width: "100%", height: activePost.images.length === 1 ? "auto" : 160,
                      objectFit: "cover" }} />
                ))}
              </div>
            )}
            <div style={{ fontSize: 12, color: C.muted, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
              ❤️ {activePost.likes?.length ?? 0} thích ·
              💬 {activePost.comments?.length ?? 0} bình luận ·
              {new Date(activePost.createdAt).toLocaleString("vi-VN")}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
