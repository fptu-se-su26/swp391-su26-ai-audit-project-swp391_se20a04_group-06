import React, { useState, useEffect } from "react";
import { useSEO } from "../hooks/useSEO";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1000;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.85
        );
      };
    };
  });
};

export function CommunityPage() {
  useSEO({
    title: "Diễn Đàn Cộng Đồng - Chia Sẻ Mâm Cơm Hải Sản | HảiSản.vn",
    description: "Nơi giao lưu, chia sẻ những khoảnh khắc nấu nướng, mâm cơm gia đình ấm cúng và phản hồi về sản phẩm từ biển khơi.",
  });

  const { user } = useAuth();
  const { addToast } = useToast();

  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // New Post Form
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submittingPost, setSubmittingPost] = useState(false);

  // Comment input state (mapped by post ID)
  const [commentInputs, setCommentInputs] = useState({});

  const fetchPosts = async (pageNum = 1) => {
    setLoading(true);
    try {
      const data = await api(`/posts?page=${pageNum}&limit=10`);
      setPosts(data.posts || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setPages(data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 4) {
      addToast("Bạn chỉ được tải lên tối đa 4 hình ảnh", "warn");
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeSelectedImage = (idx) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== idx);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== idx);
    setImageFiles(updatedFiles);
    setImagePreviews(updatedPreviews);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      addToast("Vui lòng nhập tiêu đề và nội dung bài viết", "warn");
      return;
    }

    setSubmittingPost(true);
    try {
      let uploadedImageUrls = [];

      // Upload images if selected
      if (imageFiles.length > 0) {
        const sigData = await api("/images/signature");

        uploadedImageUrls = await Promise.all(
          imageFiles.map(async (file) => {
            const compressed = await compressImage(file);
            const fd = new FormData();
            fd.append("file", compressed);
            fd.append("api_key", sigData.apiKey);
            fd.append("timestamp", sigData.timestamp);
            fd.append("signature", sigData.signature);
            fd.append("folder", sigData.folder);

            const cloudRes = await fetch(
              `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
              { method: "POST", body: fd }
            );

            if (!cloudRes.ok) {
              throw new Error("Không thể tải ảnh lên CDN");
            }

            const cloudData = await cloudRes.json();
            return cloudData.secure_url;
          })
        );
      }

      await api("/posts", {
        method: "POST",
        body: {
          title: newTitle,
          content: newContent,
          images: uploadedImageUrls,
          tags: ["Cộng Đồng"],
        },
      });

      addToast("Đăng bài viết thành công!", "success");
      setNewTitle("");
      setNewContent("");
      setImageFiles([]);
      setImagePreviews([]);
      fetchPosts(1);
    } catch (err) {
      addToast(err.message || "Có lỗi xảy ra", "error");
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleLikePost = async (postId) => {
    if (!user) {
      addToast("Vui lòng đăng nhập để thích bài viết", "warn");
      return;
    }

    try {
      const res = await api(`/posts/${postId}/like`, { method: "POST" });
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id === postId) {
            const currentUserId = user.userId || user.id;
            const likes = p.likes.includes(currentUserId)
              ? p.likes.filter((id) => id !== currentUserId)
              : [...p.likes, currentUserId];
            return { ...p, likes };
          }
          return p;
        })
      );
    } catch (err) {
      addToast(err.message || "Có lỗi xảy ra", "error");
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    if (!user) {
      addToast("Vui lòng đăng nhập để bình luận", "warn");
      return;
    }

    const text = commentInputs[postId] || "";
    if (!text.trim()) return;

    try {
      const res = await api(`/posts/${postId}/comments`, {
        method: "POST",
        body: { text },
      });

      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, comments: res.comments } : p))
      );

      // Clear input
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      addToast(err.message || "Không thể gửi bình luận", "error");
    }
  };

  const handleCommentInputChange = (postId, text) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này không?")) return;

    try {
      await api(`/posts/${postId}`, { method: "DELETE" });
      addToast("Xóa bài viết thành công", "success");
      fetchPosts(page);
    } catch (err) {
      addToast(err.message || "Có lỗi xảy ra khi xóa", "error");
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bình luận này?")) return;

    try {
      const res = await api(`/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
      });

      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, comments: res.comments } : p))
      );
      addToast("Đã xóa bình luận", "success");
    } catch (err) {
      addToast(err.message || "Có lỗi xảy ra", "error");
    }
  };

  return (
    <div className="page-wrap-sm fade-up">
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: "900", color: "var(--dark)", marginBottom: "12px" }}>
          Diễn Đàn Cộng Đồng
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "15px", lineHeight: "1.6" }}>
          Nơi chia sẻ mâm cơm ấm cúng, niềm vui nhận hải sản tươi ngon hôm nay và trao đổi bí quyết bếp núc.
        </p>
      </div>

      {/* New Post Panel */}
      {user ? (
        <div style={{
          background: "var(--white)",
          borderRadius: "var(--radius-xl)",
          padding: "24px",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
          marginBottom: "40px"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--dark)", marginBottom: "16px" }}>
            Đăng bài viết mới
          </h3>
          <form onSubmit={handleCreatePost} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <input 
              type="text"
              placeholder="Tiêu đề bài viết..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                fontSize: "14px",
                outline: "none"
              }}
              required
            />
            <textarea 
              rows="3"
              placeholder="Hôm nay bạn nhận được mẻ hải sản gì? Món ăn chế biến ra sao? Chia sẻ cảm nhận tại đây nhé..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                fontSize: "14px",
                outline: "none",
                resize: "vertical"
              }}
              required
            />

            {/* Images Previews */}
            {imagePreviews.length > 0 && (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} style={{ position: "relative", width: "80px", height: "80px", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                    <img src={preview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button 
                      type="button" 
                      onClick={() => removeSelectedImage(idx)}
                      style={{
                        position: "absolute",
                        top: "2px",
                        right: "2px",
                        background: "rgba(0,0,0,0.6)",
                        color: "var(--white)",
                        border: "none",
                        borderRadius: "50%",
                        width: "18px",
                        height: "18px",
                        fontSize: "11px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
              <label style={{
                cursor: "pointer",
                fontSize: "13px",
                color: "var(--ocean)",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                📷 Thêm hình ảnh
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleImageChange} 
                  style={{ display: "none" }} 
                />
              </label>

              <button 
                type="submit"
                disabled={submittingPost}
                style={{
                  background: "var(--coral)",
                  color: "var(--white)",
                  border: "none",
                  borderRadius: "99px",
                  padding: "8px 24px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(232, 100, 58, 0.25)"
                }}
              >
                {submittingPost ? "Đang đăng..." : "Đăng bài"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{
          textAlign: "center",
          padding: "20px",
          background: "var(--ocean-p)",
          borderRadius: "var(--radius-lg)",
          color: "var(--ocean-d)",
          fontSize: "14px",
          fontWeight: "600",
          marginBottom: "40px"
        }}>
          💡 Vui lòng đăng nhập để viết bài viết và thảo luận cùng mọi người.
        </div>
      )}

      {/* Posts List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          Đang tải bài viết...
        </div>
      ) : posts.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "40px",
          color: "var(--muted)",
          background: "var(--white)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-l)"
        }}>
          Chưa có bài viết nào trên cộng đồng.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {posts.map((post) => {
            const hasLiked = user && post.likes.includes(user.userId || user.id);
            const isPostAuthor = user && (user.role === "Admin" || post.userId === user.userId || post.userId === user.id);
            
            return (
              <div key={post._id} style={{
                background: "var(--white)",
                borderRadius: "var(--radius-xl)",
                padding: "28px",
                border: "1px solid var(--border-l)",
                boxShadow: "var(--shadow-sm)"
              }}>
                {/* Post Author info */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "var(--bg-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      color: "var(--ocean)",
                      fontSize: "16px"
                    }}>
                      {post.userName ? post.userName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <strong style={{ fontSize: "14px", color: "var(--dark)", display: "block" }}>
                        {post.userName || "Thành viên"}
                      </strong>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")} lúc {new Date(post.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {isPostAuthor && (
                    <button 
                      onClick={() => handleDeletePost(post._id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#e74c3c",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      Xóa bài
                    </button>
                  )}
                </div>

                {/* Post Content */}
                <h4 style={{ fontSize: "16px", fontWeight: "800", color: "var(--dark)", marginBottom: "8px" }}>
                  {post.title}
                </h4>
                <p style={{
                  fontSize: "14px",
                  color: "var(--text-2)",
                  lineHeight: "1.6",
                  whiteSpace: "pre-line",
                  marginBottom: "16px"
                }}>
                  {post.content}
                </p>

                {/* Images Grid */}
                {post.images && post.images.length > 0 && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: post.images.length === 1 ? "1fr" : "repeat(2, 1fr)",
                    gap: "8px",
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    marginBottom: "16px"
                  }}>
                    {post.images.map((imgUrl, i) => (
                      <img 
                        key={i} 
                        src={imgUrl} 
                        alt="Attached" 
                        style={{ width: "100%", height: post.images.length === 1 ? "auto" : "180px", objectFit: "cover" }} 
                      />
                    ))}
                  </div>
                )}

                {/* Toolbar */}
                <div style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "center",
                  borderTop: "1px solid var(--border-l)",
                  borderBottom: "1px solid var(--border-l)",
                  padding: "10px 0",
                  marginBottom: "16px"
                }}>
                  <button 
                    onClick={() => handleLikePost(post._id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: hasLiked ? "var(--coral)" : "var(--text-2)",
                      fontWeight: "700",
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    ❤️ Thích ({post.likes?.length || 0})
                  </button>
                  <span style={{ fontSize: "13px", color: "var(--muted)", fontWeight: "600" }}>
                    💬 Bình luận ({post.comments?.length || 0})
                  </span>
                  <span style={{ fontSize: "13px", color: "var(--muted)", marginLeft: "auto" }}>
                    👁️ {post.viewCount || 0} lượt xem
                  </span>
                </div>

                {/* Comments Section */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--bg)", borderRadius: "var(--radius-lg)", padding: "16px" }}>
                  {post.comments && post.comments.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "10px" }}>
                      {post.comments.map((comment) => {
                        const isCommentAuthor = user && (user.role === "Admin" || comment.userId === user.userId || comment.userId === user.id || post.userId === user.userId || post.userId === user.id);
                        return (
                          <div key={comment._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "13px" }}>
                            <div>
                              <strong style={{ color: "var(--dark)" }}>{comment.userName}:</strong>
                              <span style={{ color: "var(--text-2)", marginLeft: "6px" }}>{comment.text}</span>
                              <span style={{ display: "block", fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                                {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                            {isCommentAuthor && (
                              <button 
                                onClick={() => handleDeleteComment(post._id, comment._id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--muted)",
                                  fontSize: "10px",
                                  cursor: "pointer"
                                }}
                              >
                                &times; Xóa
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Comment Form */}
                  {user && (
                    <form 
                      onSubmit={(e) => handleAddComment(e, post._id)}
                      style={{ display: "flex", gap: "8px" }}
                    >
                      <input 
                        type="text" 
                        placeholder="Viết bình luận..."
                        value={commentInputs[post._id] || ""}
                        onChange={(e) => handleCommentInputChange(post._id, e.target.value)}
                        style={{
                          flex: "1",
                          padding: "8px 12px",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border)",
                          fontSize: "13px",
                          outline: "none"
                        }}
                      />
                      <button 
                        type="submit"
                        style={{
                          background: "var(--ocean)",
                          color: "var(--white)",
                          border: "none",
                          borderRadius: "var(--radius-md)",
                          padding: "8px 16px",
                          fontWeight: "700",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        Gửi
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
