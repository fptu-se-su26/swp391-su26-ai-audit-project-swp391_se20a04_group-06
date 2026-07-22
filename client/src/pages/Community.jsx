import { Heart, Image, Loader, MessageCircle, Pencil, Plus, Send, Trash2, X, Flag } from "lucide-react";
import ImageUploader from "../components/shared/ImageUploader";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReportDialog from "../components/ReportDialog";
import { useAuth } from "../context/AuthContext";
import { apiPosts, apiReports } from "../services/api";
import { getOptimizedImageUrl } from "../utils/image";
import { canManageOwnedContent, getIdentityId } from "../utils/ownership";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";
import IconActionButton from "../components/common/IconActionButton";
import useSEO from "../hooks/useSEO";


const initialEditForm = { title: "", content: "", tags: "" };
const postTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
});
const postDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const formatPostDateTime = (value) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return `${postTimeFormatter.format(date)} • ${postDateFormatter.format(date)}`;
};

function PostAvatar({ avatar, name }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatar]);

  const initials = String(name || "HS")
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span className="community-post__avatar" aria-hidden="true">
      {avatar && !imageFailed ? (
        <img
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
          src={getOptimizedImageUrl(avatar, 96, 96)}
        />
      ) : (
        initials
      )}
    </span>
  );
}

export default function Community() {
  useSEO("Diễn đàn", "Diễn đàn chia sẻ kiến thức đánh bắt, bảo quản hải sản và giao lưu cùng ngư dân.");
  const { confirm } = useConfirm();
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [likingIds, setLikingIds] = useState(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", imageFiles: [], tags: "" });


  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});

  const toggleComments = (postId) => {
    setExpandedComments((current) => ({
      ...current,
      [postId]: !current[postId]
    }));
  };

  const load = () =>
    apiPosts
      .getAll({ limit: 30 })
      .then((data) => setPosts(data?.posts || []))
      .finally(() => setLoading(false));

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!editingPost) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !savingEdit) {
        setEditingPost(null);
        setEditForm(initialEditForm);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [editingPost, savingEdit]);

  const requireLogin = () => {
    if (user) return true;
    navigate("/login", { state: { message: "Bạn cần đăng nhập để tương tác diễn đàn." } });
    return false;
  };

  const validatePostForm = (postForm) => {
    if (!postForm.title || postForm.title.trim().length === 0) {
      throw new Error("Tiêu đề bài viết không được để trống.");
    }
    if (postForm.title.trim().length > 150) {
      throw new Error("Tiêu đề bài viết không được vượt quá 150 ký tự.");
    }
    if (!postForm.content || postForm.content.trim().length === 0) {
      throw new Error("Nội dung bài viết không được để trống.");
    }
    if (postForm.content.trim().length > 10000) {
      throw new Error("Nội dung bài viết không được vượt quá 10000 ký tự.");
    }
    if (postForm.imageFiles && postForm.imageFiles.length > 10) {
      throw new Error("Chỉ được đăng tối đa 10 hình ảnh.");
    }
    const tagsArray = (postForm.tags || "").split(",").map((item) => item.trim()).filter(Boolean);
    if (tagsArray.length > 10) {
      throw new Error("Số lượng tags tối đa là 10.");
    }
    for (const tag of tagsArray) {
      if (tag.length > 30) {
        throw new Error("Mỗi tag tối đa 30 ký tự.");
      }
    }
  };

  const createPost = async (event) => {
    event.preventDefault();
    if (!requireLogin()) return;

    try {
      validatePostForm(form);
    } catch (err) {
      toast.error(err.message);
      return;
    }

    setSavingPost(true);
    const toastId = toast.loading("Đang đăng bài viết...");
    try {
      let images = [];
      if (form.imageFiles?.length > 0) {
        const fd = new FormData();
        form.imageFiles.forEach((file) => fd.append("images", file));
        const uploadResult = await apiPosts.uploadImages(fd);
        images = uploadResult?.urls || [];
      }
      await apiPosts.create({
        title: form.title.trim(),
        content: form.content.trim(),
        images,
        tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean),
      });
      await load();
      setForm({ title: "", content: "", imageFiles: [], tags: "" });
      setFormOpen(false);
      toast.update(toastId, "Đăng bài viết thành công!", "success");
    } catch (error) {
      toast.update(toastId, error.message || "Không thể đăng bài viết.", "error");
    } finally {
      setSavingPost(false);
    }
  };



  const toggleLike = async (post) => {
    if (!requireLogin()) return;
    const id = post.id || post._id;
    if (likingIds.has(id)) return;

    setLikingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    const currentUserId = String(user.id || user._id);
    const originalPosts = [...posts];

    // Optimistic UI update
    setPosts((current) =>
      current.map((item) => {
        if ((item.id || item._id) !== id) return item;
        let nextLikes = [...(item.likes || [])].map(String);
        const wasLiked = nextLikes.includes(currentUserId);
        if (wasLiked) {
          nextLikes = nextLikes.filter((uid) => uid !== currentUserId);
        } else {
          nextLikes.push(currentUserId);
        }
        const delta = wasLiked ? -1 : 1;
        return {
          ...item,
          likeCount: Math.max(0, (item.likeCount ?? item.likes?.length ?? 0) + delta),
          likes: nextLikes,
        };
      })
    );

    try {
      const result = await apiPosts.toggleLike(id);
      setPosts((current) =>
        current.map((item) => {
          if ((item.id || item._id) !== id) return item;
          let nextLikes = [...(item.likes || [])].map(String);
          if (result.liked) {
            if (!nextLikes.includes(currentUserId)) nextLikes.push(currentUserId);
          } else {
            nextLikes = nextLikes.filter((uid) => uid !== currentUserId);
          }
          return {
            ...item,
            likeCount: result.likeCount,
            likes: nextLikes,
          };
        })
      );
    } catch (error) {
      setPosts(originalPosts);
      toast.error(error.message || "Không thể tương tác.");
    } finally {
      setLikingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const addComment = async (post) => {
    if (!requireLogin()) return;
    const id = post.id || post._id;
    const text = comments[id]?.trim();
    if (!text) return;
    try {
      const result = await apiPosts.addComment(id, text);
      setPosts((current) =>
        current.map((item) =>
          (item.id || item._id) === id ? { ...item, comments: result.comments } : item,
        ),
      );
      setComments((current) => ({ ...current, [id]: "" }));
    } catch (error) {
      toast.error(error.message || "Không thể gửi bình luận.");
    }
  };

  const deletePost = async (post) => {
    const id = post.id || post._id;
    if (!id || !canManageOwnedContent(user, post.userId)) return;
    const ok = await confirm({
      title: "Xóa bài viết?",
      message: `Bạn có chắc muốn xóa bài viết "${post.title}"? Thao tác này không thể hoàn tác.`,
      confirmText: "Xóa bài viết",
      variant: "danger"
    });
    if (!ok) return;

    setDeletingId(id);
    try {
      await apiPosts.delete(id);
      setPosts((current) => current.filter((item) => (item.id || item._id) !== id));
      toast.success("Đã xóa bài viết thành công.");
    } catch (error) {
      toast.error(error.message || "Không thể xóa bài viết.");
    } finally {
      setDeletingId(null);
    }
  };

  const openEditPost = (post) => {
    if (!canManageOwnedContent(user, post.userId)) return;
    setEditingPost(post);
    setEditForm({
      title: post.title || "",
      content: post.content || "",
      tags: Array.isArray(post.tags) ? post.tags.join(", ") : String(post.tags || ""),
    });
  };

  const closeEditPost = () => {
    if (savingEdit) return;
    setEditingPost(null);
    setEditForm(initialEditForm);
  };

  const savePost = async (event) => {
    event.preventDefault();
    const id = editingPost?.id || editingPost?._id;
    if (!id || !canManageOwnedContent(user, editingPost.userId)) return;

    try {
      validatePostForm(editForm);
    } catch (err) {
      toast.error(err.message);
      return;
    }

    setSavingEdit(true);
    const toastId = toast.loading("Đang cập nhật bài viết...");
    try {
      const result = await apiPosts.update(id, {
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        tags: editForm.tags.split(",").map((item) => item.trim()).filter(Boolean),
      });
      setPosts((current) =>
        current.map((post) =>
          (post.id || post._id) === id ? { ...post, ...(result?.post || {}) } : post,
        ),
      );
      setEditingPost(null);
      setEditForm(initialEditForm);
      toast.update(toastId, "Cập nhật bài viết thành công!", "success");
    } catch (error) {
      toast.update(toastId, error.message || "Không thể cập nhật bài viết.", "error");
    } finally {
      setSavingEdit(false);
    }
  };


  return (
    <div className="page-container community-page">
      <header className="page-heading" data-tour="community-heading" style={{ justifyContent: "flex-end", marginBottom: "16px" }}>
        <button className="button button--primary" data-tour="community-create-post" onClick={() => requireLogin() && setFormOpen((open) => !open)} type="button">
          <Plus size={17} /> Tạo bài viết
        </button>
      </header>

      {formOpen && (
        <form className="dashboard-panel feature-form" onSubmit={createPost}>
          <input maxLength={150} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Tiêu đề bài viết" required value={form.title} />
          <textarea maxLength={5000} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Nội dung chia sẻ..." required rows="5" value={form.content} />
          <div className="form-field" style={{ marginBottom: "8px" }}>
            <ImageUploader
              files={form.imageFiles}
              maxFiles={4}
              onChange={(files) => setForm({ ...form, imageFiles: files })}
            />
          </div>
          <input onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="Thẻ: đánh bắt, bảo quản, vùng biển..." value={form.tags} />
          <div className="form-actions"><button className="button button--primary" disabled={savingPost} type="submit">{savingPost ? <><Loader size={15} className="toast-spinner" /> Đang xử lý...</> : <><Send size={16} /> Đăng bài</>}</button></div>
        </form>
      )}

      {editingPost && (
        <div
          className="community-edit-modal"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditPost();
          }}
          role="presentation"
        >
          <section
            aria-labelledby="community-edit-title"
            aria-modal="true"
            className="community-edit-dialog"
            role="dialog"
          >
            <header>
              <div>
                <span className="eyebrow">CHỈNH SỬA BÀI VIẾT</span>
                <h2 id="community-edit-title">{editingPost.title}</h2>
              </div>
              <button
                aria-label="Đóng form sửa bài viết"
                disabled={savingEdit}
                onClick={closeEditPost}
                type="button"
              >
                <X size={18} />
              </button>
            </header>
            <form className="feature-form community-edit-form" onSubmit={savePost}>
              <label className="form-field">
                <span>Tiêu đề</span>
                <input
                  autoFocus
                  maxLength={150}
                  onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
                  required
                  value={editForm.title}
                />
              </label>
              <label className="form-field">
                <span>Nội dung chia sẻ</span>
                <textarea
                  maxLength={5000}
                  onChange={(event) => setEditForm((current) => ({ ...current, content: event.target.value }))}
                  required
                  rows="7"
                  value={editForm.content}
                />
              </label>
              <label className="form-field">
                <span>Hashtag, phân cách bằng dấu phẩy</span>
                <input
                  onChange={(event) => setEditForm((current) => ({ ...current, tags: event.target.value }))}
                  value={editForm.tags}
                />
              </label>
              {editingPost.images?.length > 0 && (
                <div className="community-edit-images" aria-label="Ảnh hiện có của bài viết">
                  {editingPost.images.slice(0, 4).map((imageUrl, index) => (
                    <img
                      alt={`Ảnh bài viết ${index + 1}`}
                      key={imageUrl}
                      src={getOptimizedImageUrl(imageUrl, 320, 200)}
                    />
                  ))}
                </div>
              )}
              <div className="form-actions">
                <button className="button button--secondary" disabled={savingEdit} onClick={closeEditPost} type="button">
                  Hủy
                </button>
                <button className="button button--primary" disabled={savingEdit} type="submit">
                  <Pencil size={16} /> {savingEdit ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {loading && <div className="page-state">Đang tải bài viết...</div>}
      <div className="community-feed" data-tour="community-feed">
        {posts.map((post) => {
          const id = post.id || post._id;
          const authorName = post.userName || "Thành viên HảiSản.vn";
          const canManage = canManageOwnedContent(user, post.userId);
          return (
            <article className="community-post" data-tour="community-post-card" key={id}>
              <header className="community-post__header">
                <Link className="community-post__author" to={`/fisherman/${getIdentityId(post.userId)}`}>
                  <PostAvatar avatar={post.userAvatar} name={authorName} />
                  <span>
                    <strong>{authorName}</strong>
                    <small>Thành viên diễn đàn HảiSản.vn</small>
                  </span>
                </Link>
                <div className="community-post__header-meta">
                  <time dateTime={post.createdAt}>{formatPostDateTime(post.createdAt)}</time>
                  {canManage && (
                    <div className="community-post__owner-actions action-button-group">
                      <IconActionButton
                        icon={<Pencil />}
                        label="Chỉnh sửa"
                        variant="primary"
                        onClick={() => openEditPost(post)}
                      />
                      <IconActionButton
                        icon={<Trash2 />}
                        label="Xóa"
                        variant="danger"
                        disabled={deletingId === id}
                        onClick={() => deletePost(post)}
                      />
                    </div>
                  )}
                </div>
              </header>
              <h2>{post.title}</h2>
              <p>{post.content}</p>
              {post.images?.length > 0 && (
                <div className="community-post__images">
                  {post.images.slice(0, 4).map((imageUrl) => (
                    <img
                      alt=""
                      key={imageUrl}
                      loading="lazy"
                      src={imageUrl}
                      style={{
                        objectFit: "cover",
                        width: "100%",
                        height: post.images.length === 1 ? "auto" : "220px",
                        borderRadius: "12px",
                        display: "block"
                      }}
                    />
                  ))}
                </div>
              )}
              <div className="tag-list">{post.tags?.map((tag) => <span key={tag}>#{tag}</span>)}</div>
              
              {/* Hàng thống kê Lượt thích & Bình luận nổi bật */}
              {(post.likes?.length > 0 || post.comments?.length > 0) && (
                <div className="community-post__stats" style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--market-line)",
                  fontSize: "0.95rem",
                  marginTop: "12px",
                  background: "rgba(8, 145, 178, 0.08)",
                  borderRadius: "10px",
                  borderLeft: "4px solid var(--market-primary)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Heart size={16} style={{ fill: "#e11d48", color: "#e11d48" }} />
                    <span style={{ fontWeight: "800", color: "var(--color-primary-strong)" }}>
                      {post.likeCount ?? post.likes?.length ?? 0} <span style={{ fontWeight: "700", color: "var(--color-text)" }}>lượt thích</span>
                    </span>
                  </div>
                  <div style={{ fontWeight: "800", color: "var(--color-primary-strong)" }}>
                    {post.comments?.length || 0} <span style={{ fontWeight: "700", color: "var(--color-text)" }}>bình luận</span>
                  </div>
                </div>
              )}

              <div className="community-post__actions" data-tour="community-post-actions">
                <button
                  className={`like-button ${user && post.likes?.map(String).includes(String(user.id || user._id)) ? "is-liked" : ""}`}
                  onClick={() => toggleLike(post)}
                  type="button"
                >
                  <Heart size={16} />
                  <span>{user && post.likes?.map(String).includes(String(user.id || user._id)) ? "Đã thích" : "Thích"}</span>
                </button>
                <button
                  className={`comment-button ${expandedComments[id] ? "is-active" : ""}`}
                  onClick={() => toggleComments(id)}
                  type="button"
                  style={{
                    color: expandedComments[id] ? "#67e8f9" : "#8fa4bb",
                    background: expandedComments[id] ? "rgba(34, 243, 255, 0.07)" : "transparent"
                  }}
                >
                  <MessageCircle size={16} />
                  <span>Bình luận</span>
                </button>
                <button
                  className="button button--ghost"
                  onClick={() => setReportTarget({ id, title: post.title })}
                  type="button"
                >
                  <Flag size={15} /> Báo cáo
                </button>
              </div>

              {expandedComments[id] && (
                <>
                  <div className="comment-list">
                    {post.comments?.map((comment) => (
                      <p key={comment._id || `${comment.userId}-${comment.createdAt}`}><strong>{comment.userName}</strong> {comment.text}</p>
                    ))}
                  </div>
                  <div className="comment-composer" data-tour="community-comment">
                    <input onChange={(event) => setComments((current) => ({ ...current, [id]: event.target.value }))} placeholder="Viết bình luận..." value={comments[id] || ""} />
                    <button aria-label="Gửi bình luận" onClick={() => addComment(post)} type="button"><Send size={16} /></button>
                  </div>
                </>
              )}
            </article>
          );
        })}
        {!loading && posts.length === 0 && <div className="empty-state"><Image size={28} /><p>Chưa có bài viết diễn đàn.</p></div>}
      </div>
      <ReportDialog
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        onSubmit={(reason) => apiReports.createForPost(reportTarget.id, reason)}
      />
    </div>
  );
}
