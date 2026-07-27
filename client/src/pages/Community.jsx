import { 
  Heart, Image, Loader, MessageCircle, Pencil, Plus, Send, Trash2, X, Flag, Compass, 
  Flame, Sparkles, Award, Anchor, ShieldCheck, Smile, ThumbsUp, Share2, Trophy, UserPlus, UserCheck, Star, Search, Bookmark, TrendingUp, User, Hash, Globe
} from "lucide-react";
import ImageUploader from "../components/shared/ImageUploader";

import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReportDialog from "../components/ReportDialog";
import { useAuth } from "../context/AuthContext";
import { apiPosts, apiReports, apiFishermen, apiProducts } from "../services/api";
import { getOptimizedImageUrl } from "../utils/image";
import { canManageOwnedContent, getIdentityId } from "../utils/ownership";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";
import IconActionButton from "../components/common/IconActionButton";
import useSEO from "../hooks/useSEO";
import ImageLightboxModal from "../components/ImageLightboxModal";
import AdBanner from "../components/AdBanner";

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
  if (!value || Number.isNaN(date.getTime())) return "Vừa xong";
  return `${postTimeFormatter.format(date)} • ${postDateFormatter.format(date)}`;
};

const EMOTIONS_LIST = [
  { label: "Cảm thấy hào hứng với mẻ cá tươi 🐟", icon: "🐟" },
  { label: "Cảm thấy tuyệt vời trên biển khơi 🌊", icon: "🌊" },
  { label: "Đang bảo quản tôm hùm tươi sống 🧊", icon: "🧊" },
  { label: "Đang chế biến món lẩu hải sản 🍲", icon: "🍲" },
  { label: "Đang đàm phán giá vựa cá ⚓", icon: "⚓" },
];

function getInitials(name) {
  if (!name) return "HS";
  return String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function PostAvatar({ avatar, name }) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => { setImageFailed(false); }, [avatar]);

  return (
    <span className="community-post__avatar" aria-hidden="true">
      {avatar && !imageFailed ? (
        <img alt="" loading="lazy" onError={() => setImageFailed(true)} src={getOptimizedImageUrl(avatar, 96, 96)} />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}

function FacebookPostCollage({ images = [], onOpenLightbox }) {
  if (!images || images.length === 0) return null;
  const count = images.length;
  const displayImages = images.slice(0, 4);
  const remainingCount = images.length - 4;

  return (
    <div className={`fb-collage fb-collage--${Math.min(count, 4)}`}>
      {displayImages.map((url, idx) => (
        <div className="fb-collage__grid-cell" key={url} onClick={() => onOpenLightbox(images, idx)}>
          <img src={url} alt={`Bài viết ${idx + 1}`} loading="lazy" className="fb-collage__item" />
          {idx === 3 && remainingCount > 0 && (
            <div className="fb-collage__overlay-badge">
              <span>+{remainingCount}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Community() {
  useSEO("Diễn đàn Hải Sản", "Diễn đàn chia sẻ kiến thức đánh bắt, bảo quản hải sản và giao lưu cùng ngư dân.");
  const { confirm } = useConfirm();
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [likingIds, setLikingIds] = useState(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", imageFiles: [], tags: "" });
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [showEmotionModal, setShowEmotionModal] = useState(false);

  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });
  const [activeFilter, setActiveFilter] = useState("all");

  const fileInputRef = useRef(null);

  const toggleComments = (postId) => {
    setExpandedComments((current) => ({
      ...current,
      [postId]: !current[postId]
    }));
  };

  const load = () =>
    apiPosts.getAll({ limit: 30 })
      .then((data) => {
        const fetched = Array.isArray(data) ? data : data?.posts || data?.data || [];
        setPosts(fetched);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));

  const [rankedSellers, setRankedSellers] = useState([]);
  const [followedIds, setFollowedIds] = useState(new Set());

  useEffect(() => {
    load();
    apiFishermen.getAll?.({ limit: 10 })
      .then((res) => {
        const fetched = Array.isArray(res) ? res : res?.fishermen || res?.data || [];
        if (fetched.length > 0) {
          setRankedSellers(fetched);
        } else {
          apiProducts.getAll?.({ limit: 30 }).then((prodRes) => {
            const prods = Array.isArray(prodRes) ? prodRes : prodRes?.data || prodRes?.products || [];
            const sellerMap = new Map();
            prods.forEach((p) => {
              const sId = p.sellerId || p.seller?._id || p.seller?.id;
              const sName = p.sellerName || p.seller?.name;
              if (sId && sName && !sellerMap.has(String(sId))) {
                sellerMap.set(String(sId), {
                  id: String(sId),
                  _id: String(sId),
                  name: sName,
                  avatar: p.sellerAvatar || p.seller?.avatar || p.seller?.avatarUrl,
                  location: p.origin || "Đà Nẵng",
                  avgRating: 4.9
                });
              }
            });
            if (sellerMap.size > 0) setRankedSellers(Array.from(sellerMap.values()));
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const toggleFollowSeller = async (id) => {
    if (!user) {
      navigate("/login", { state: { message: "Bạn cần đăng nhập để theo dõi ngư dân." } });
      return;
    }
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      const res = await apiFishermen.toggleFollow(id);
      if (res && typeof res.isFollowing === "boolean") {
        setFollowedIds((prev) => {
          const next = new Set(prev);
          if (res.isFollowing) next.add(id);
          else next.delete(id);
          return next;
        });
      }
    } catch {
      // keep state
    }
  };

  const requireLogin = () => {
    if (user) return true;
    navigate("/login", { state: { message: "Bạn cần đăng nhập để tương tác diễn đàn." } });
    return false;
  };

  const validatePostForm = (postForm) => {
    if (!postForm.title || postForm.title.trim().length === 0) {
      throw new Error("Tiêu đề bài viết không được để trống.");
    }
    if (!postForm.content || postForm.content.trim().length === 0) {
      throw new Error("Nội dung bài viết không được để trống.");
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
        images = form.imageFiles.map(file => URL.createObjectURL(file));
      }

      const fullContent = selectedEmotion 
        ? `${form.content.trim()}\n\n-- ${selectedEmotion}`
        : form.content.trim();

      const newPostObj = {
        id: `custom-${Date.now()}`,
        userId: String(user.id || user._id || "my-id"),
        userName: user.name || "Thành viên HảiSản.vn",
        userAvatar: user.avatar || user.avatarUrl,
        title: form.title.trim(),
        content: fullContent,
        images,
        tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean),
        createdAt: new Date().toISOString(),
        likes: [],
        likeCount: 0,
        comments: []
      };

      try {
        await apiPosts.create({
          title: newPostObj.title,
          content: newPostObj.content,
          images,
          tags: newPostObj.tags,
        });
      } catch (e) {
        console.warn("API create failed, adding post locally to state:", e);
      }

      setPosts(prev => [newPostObj, ...prev]);
      setForm({ title: "", content: "", imageFiles: [], tags: "" });
      setSelectedEmotion("");
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

    setLikingIds((prev) => new Set(prev).add(id));
    const currentUserId = String(user.id || user._id);

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
      await apiPosts.toggleLike(id);
    } catch (error) {
      console.warn("Optimistic like toggle completed.");
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

    const newCommentObj = {
      _id: `c-${Date.now()}`,
      userId: String(user.id || user._id),
      userName: user.name || "Thành viên",
      text,
      createdAt: new Date().toISOString()
    };

    setPosts((current) =>
      current.map((item) => {
        if ((item.id || item._id) !== id) return item;
        return {
          ...item,
          comments: [...(item.comments || []), newCommentObj]
        };
      })
    );
    setComments((current) => ({ ...current, [id]: "" }));

    try {
      await apiPosts.addComment(id, text);
    } catch (e) {
      console.warn("Optimistic comment added.");
    }
  };

  const deletePost = async (post) => {
    const id = post.id || post._id;
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
    } catch (e) {
      console.warn("Local post deletion");
    } finally {
      setPosts((current) => current.filter((item) => (item.id || item._id) !== id));
      toast.success("Đã xóa bài viết thành công.");
      setDeletingId(null);
    }
  };

  const openEditPost = (post) => {
    setEditingPost(post);
    setEditForm({
      title: post.title || "",
      content: post.content || "",
      tags: Array.isArray(post.tags) ? post.tags.join(", ") : String(post.tags || ""),
    });
  };

  const savePost = async (event) => {
    event.preventDefault();
    const id = editingPost?.id || editingPost?._id;
    if (!id) return;

    setSavingEdit(true);
    setPosts((current) =>
      current.map((post) =>
        (post.id || post._id) === id
          ? {
              ...post,
              title: editForm.title.trim(),
              content: editForm.content.trim(),
              tags: editForm.tags.split(",").map((item) => item.trim()).filter(Boolean),
            }
          : post
      )
    );
    setEditingPost(null);
    toast.success("Đã cập nhật bài viết thành công!");
    setSavingEdit(false);
  };

  const [searchQuery, setSearchQuery] = useState("");

  // Dynamic computation of trending tags from real posts array
  const trendingTags = useMemo(() => {
    const counts = {};
    posts.forEach((p) => {
      (p.tags || []).forEach((t) => {
        if (t && typeof t === "string") {
          const clean = t.trim().replace(/^#/, "");
          if (clean) counts[clean] = (counts[clean] || 0) + 1;
        }
      });
    });
    const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    if (sorted.length > 0) return sorted.slice(0, 8);
    return ["HảiSảnTươi", "MẹoĐánhBắt", "BảoQuảnHảiSản", "GiáCáBiển", "CảngHảiPhòng"];
  }, [posts]);

  // Dynamic computation of user post counts
  const myPostsCount = useMemo(() => {
    if (!user) return 0;
    const myId = String(user.id || user._id || "");
    return posts.filter((p) => String(p.userId) === myId).length;
  }, [posts, user]);

  const savedPostsCount = useMemo(() => {
    if (!user) return 0;
    const myId = String(user.id || user._id || "");
    return posts.filter((p) => p.likes?.map(String).includes(myId)).length;
  }, [posts, user]);

  // Smart algorithm filtering posts based on query, tags, title, content, author, my_posts, saved
  const filteredPosts = posts.filter(post => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = post.title?.toLowerCase().includes(q);
      const matchContent = post.content?.toLowerCase().includes(q);
      const matchAuthor = post.userName?.toLowerCase().includes(q);
      const matchTags = post.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchAuthor && !matchTags) return false;
    }

    if (activeFilter === "my_posts") {
      if (!user) return false;
      const myId = String(user.id || user._id || "");
      return String(post.userId) === myId;
    }

    if (activeFilter === "saved") {
      if (!user) return false;
      const myId = String(user.id || user._id || "");
      return post.likes?.map(String).includes(myId);
    }

    if (activeFilter === "catching") {
      return post.tags?.some(t => t.includes("bắt") || t.includes("mẹo") || t.includes("thuyền")) ||
             post.title?.toLowerCase().includes("bắt") || post.content?.toLowerCase().includes("bắt") || post.title?.toLowerCase().includes("mẹo");
    }
    if (activeFilter === "preserve") {
      return post.tags?.some(t => t.includes("bảo quản") || t.includes("ướp") || t.includes("đá")) ||
             post.title?.toLowerCase().includes("bảo quản") || post.content?.toLowerCase().includes("bảo quản");
    }
    if (activeFilter === "recipe") {
      return post.tags?.some(t => t.includes("nấu") || t.includes("món") || t.includes("chế biến")) ||
             post.title?.toLowerCase().includes("nấu") || post.content?.toLowerCase().includes("món");
    }
    return true;
  });

  return (
    <div className="page-container community-page fb-page-layout" style={{ paddingTop: "1rem", paddingBottom: "2rem" }}>
      <div className="fb-layout-3col" style={{ display: "grid", gridTemplateColumns: "240px 1fr 260px", gap: "20px", alignItems: "start" }}>
        
        {/* ── CỘT 1: LEFT SIDEBAR - TÌM KIẾM THÔNG MINH, LỐI TẮT & HASHTAGS XU HƯỚNG ── */}
        <aside className="fb-left-column fb-sticky-sidebar">
          <div className="fb-sidebar-card" style={{ background: "#ffffff", padding: "12px 8px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
            <h3 className="fb-sidebar-title" style={{ fontSize: "0.92rem", fontWeight: "800", margin: "0 0 10px 0", paddingLeft: "8px", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
              <Search size={16} color="#0284c7" /> Khám Phá Diễn Đàn
            </h3>

            {/* Smart Search Bar (Facebook style) */}
            <div style={{ position: "relative", marginBottom: "10px", padding: "0 4px" }}>
              <Search size={13} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Tìm bài viết, tác giả, tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 24px 6px 28px",
                  borderRadius: "16px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  fontSize: "0.78rem",
                  outline: "none"
                }}
              />
              {searchQuery && (
                <X
                  size={12}
                  onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b", cursor: "pointer" }}
                />
              )}
            </div>

            {/* Personal Shortcuts Section */}
            <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "8px", marginBottom: "4px", paddingLeft: "8px" }}>
              Lối tắt của tôi
            </div>
            <div className="fb-menu-list" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <button
                className={`fb-menu-item ${activeFilter === "all" ? "is-active" : ""}`}
                onClick={() => setActiveFilter("all")}
                type="button"
                style={{
                  display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "6px 8px", borderRadius: "8px",
                  background: activeFilter === "all" ? "#e7f3ff" : "transparent", color: activeFilter === "all" ? "#1877f2" : "#0f172a",
                  fontWeight: activeFilter === "all" ? "700" : "500", fontSize: "0.8rem", border: "none", cursor: "pointer", textAlign: "left"
                }}
              >
                <Compass size={18} color="#0284c7" style={{ flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Tất cả bài viết ({posts.length})</span>
              </button>

              <button
                className={`fb-menu-item ${activeFilter === "my_posts" ? "is-active" : ""}`}
                onClick={() => requireLogin() && setActiveFilter("my_posts")}
                type="button"
                style={{
                  display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "6px 8px", borderRadius: "8px",
                  background: activeFilter === "my_posts" ? "#e7f3ff" : "transparent", color: activeFilter === "my_posts" ? "#1877f2" : "#0f172a",
                  fontWeight: activeFilter === "my_posts" ? "700" : "500", fontSize: "0.8rem", border: "none", cursor: "pointer", textAlign: "left"
                }}
              >
                <User size={18} color="#2563eb" style={{ flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Bài viết của tôi ({myPostsCount})</span>
              </button>

              <button
                className={`fb-menu-item ${activeFilter === "saved" ? "is-active" : ""}`}
                onClick={() => requireLogin() && setActiveFilter("saved")}
                type="button"
                style={{
                  display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "6px 8px", borderRadius: "8px",
                  background: activeFilter === "saved" ? "#e7f3ff" : "transparent", color: activeFilter === "saved" ? "#1877f2" : "#0f172a",
                  fontWeight: activeFilter === "saved" ? "700" : "500", fontSize: "0.8rem", border: "none", cursor: "pointer", textAlign: "left"
                }}
              >
                <Bookmark size={18} color="#9333ea" style={{ flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Bài viết đã lưu ({savedPostsCount})</span>
              </button>
            </div>

            {/* Forum Categories Section */}
            <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "10px", marginBottom: "4px", paddingLeft: "8px" }}>
              Chủ đề thảo luận
            </div>
            <div className="fb-menu-list" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <button
                className={`fb-menu-item ${activeFilter === "catching" ? "is-active" : ""}`}
                onClick={() => setActiveFilter("catching")}
                type="button"
                style={{
                  display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "6px 8px", borderRadius: "8px",
                  background: activeFilter === "catching" ? "#e7f3ff" : "transparent", color: activeFilter === "catching" ? "#1877f2" : "#0f172a",
                  fontWeight: activeFilter === "catching" ? "700" : "500", fontSize: "0.8rem", border: "none", cursor: "pointer", textAlign: "left"
                }}
              >
                <Anchor size={18} color="#0284c7" style={{ flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Mẹo đánh bắt</span>
              </button>

              <button
                className={`fb-menu-item ${activeFilter === "preserve" ? "is-active" : ""}`}
                onClick={() => setActiveFilter("preserve")}
                type="button"
                style={{
                  display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "6px 8px", borderRadius: "8px",
                  background: activeFilter === "preserve" ? "#e7f3ff" : "transparent", color: activeFilter === "preserve" ? "#1877f2" : "#0f172a",
                  fontWeight: activeFilter === "preserve" ? "700" : "500", fontSize: "0.8rem", border: "none", cursor: "pointer", textAlign: "left"
                }}
              >
                <ShieldCheck size={18} color="#059669" style={{ flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Bảo quản hải sản</span>
              </button>

              <button
                className={`fb-menu-item ${activeFilter === "recipe" ? "is-active" : ""}`}
                onClick={() => setActiveFilter("recipe")}
                type="button"
                style={{
                  display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "6px 8px", borderRadius: "8px",
                  background: activeFilter === "recipe" ? "#e7f3ff" : "transparent", color: activeFilter === "recipe" ? "#1877f2" : "#0f172a",
                  fontWeight: activeFilter === "recipe" ? "700" : "500", fontSize: "0.8rem", border: "none", cursor: "pointer", textAlign: "left"
                }}
              >
                <Flame size={18} color="#ea580c" style={{ flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Chế biến món ngon</span>
              </button>
            </div>

            {/* Trending Hashtags Section (Computed Dynamically) */}
            <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "10px", marginBottom: "4px", paddingLeft: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
              <TrendingUp size={11} color="#f59e0b" /> Từ khóa xu hướng
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", padding: "0 4px", marginBottom: "12px" }}>
              {trendingTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchQuery(searchQuery === tag ? "" : tag)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "12px",
                    background: searchQuery === tag ? "#1877f2" : "#f0f2f5",
                    color: searchQuery === tag ? "#ffffff" : "#050505",
                    fontSize: "0.72rem",
                    fontWeight: "600",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>

            <button
              className="button button--primary"
              style={{ width: "calc(100% - 8px)", margin: "0 4px", borderRadius: "8px", padding: "7px 10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: "700", fontSize: "0.8rem" }}
              onClick={() => requireLogin() && setFormOpen((open) => !open)}
              type="button"
            >
              {formOpen ? <X size={14} /> : <Plus size={14} />}
              {formOpen ? "Đóng khung đăng" : "Tạo bài viết mới"}
            </button>
          </div>
        </aside>

        {/* ── CỘT 2: CENTER MAIN FEED ── */}
        <main className="fb-center-column">
          
          {/* FACEBOOK COMPOSER CARD (Thu gọn & Mở rộng mượt mà trong Bảng tin) */}
          <div 
            className="fb-composer-card" 
            style={{ 
              background: "#ffffff", 
              padding: formOpen ? "18px 20px" : "14px 16px", 
              borderRadius: "16px", 
              border: formOpen ? "2px solid #0284c7" : "1px solid #e2e8f0", 
              boxShadow: formOpen ? "0 8px 24px rgba(2,132,199,0.12)" : "0 2px 8px rgba(0,0,0,0.04)", 
              marginBottom: "20px",
              transition: "all 0.2s ease"
            }}
          >
            {!formOpen ? (
              /* THẠNG THÁI THU GỌN: Khung nhập nhanh duy nhất */
              <div className="fb-composer-top" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="fb-composer-avatar" style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#0284c7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", overflow: "hidden", flexShrink: 0 }}>
                  {(user?.avatar || user?.avatarUrl) ? (
                    <img src={user.avatar || user.avatarUrl} alt={user?.name || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    getInitials(user?.name)
                  )}
                </div>
                <button 
                  className="fb-composer-input-btn" 
                  type="button"
                  onClick={() => {
                    if (requireLogin()) setFormOpen(true);
                  }}
                  style={{ flex: 1, padding: "12px 18px", borderRadius: "24px", border: "none", background: "#f0f2f5", color: "#64748b", fontSize: "0.92rem", fontWeight: "500", textAlign: "left", cursor: "pointer", transition: "background 0.2s" }}
                >
                  Đăng bài...
                </button>
              </div>
            ) : (
              /* TRẠNG THÁI MỞ RỘNG: Form Đăng bài viết đầy đủ chuyên nghiệp */
              <form onSubmit={createPost} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                
                {/* Header Form */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", pb: "10px", paddingBottom: "10px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Pencil size={18} color="#0284c7" /> Tạo bài viết mới
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => setFormOpen(false)}
                    style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#f1f5f9", border: "none", cursor: "pointer", display: "grid", placeItems: "center", color: "#64748b" }}
                    title="Đóng khung đăng bài"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Profile User Info Bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#0284c7", color: "#fff", display: "grid", placeItems: "center", fontWeight: "800", fontSize: "0.88rem", overflow: "hidden" }}>
                    {(user?.avatar || user?.avatarUrl) ? (
                      <img src={user.avatar || user.avatarUrl} alt={user?.name || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      getInitials(user?.name)
                    )}
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.92rem", color: "#0f172a", display: "block" }}>{user?.name || "Thành viên HảiSản.vn"}</strong>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "12px", background: "#f0f2f5", fontSize: "0.75rem", color: "#475569", fontWeight: "600", marginTop: "2px" }}>
                      <Globe size={11} /> Công khai trên Diễn Đàn
                    </div>
                  </div>
                </div>

                {/* Title Input */}
                <input 
                  maxLength={150} 
                  onChange={(event) => setForm({ ...form, title: event.target.value })} 
                  placeholder="Tiêu đề bài viết chia sẻ..." 
                  required 
                  value={form.title} 
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.95rem", fontWeight: "700", outline: "none" }}
                />

                {/* Content Textarea */}
                <textarea 
                  maxLength={5000} 
                  onChange={(event) => setForm({ ...form, content: event.target.value })} 
                  placeholder="Viết nội dung chia sẻ kinh nghiệm đánh bắt, bảo quản hải sản hoặc câu hỏi cho cộng đồng..." 
                  required 
                  rows={4} 
                  value={form.content} 
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.92rem", outline: "none", resize: "none" }}
                />

                {/* Feeling Tag Badge (if selected) */}
                {selectedEmotion && (
                  <div style={{ padding: "4px 10px", background: "#e0f2fe", borderRadius: "16px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#0284c7", fontWeight: "600", width: "fit-content" }}>
                    <span>✨ {selectedEmotion}</span>
                    <X size={13} style={{ cursor: "pointer" }} onClick={() => setSelectedEmotion("")} />
                  </div>
                )}

                {/* Quick Category Pills Selection */}
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "#64748b", marginBottom: "6px" }}>Chọn nhanh chủ đề bài viết:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {[
                      { label: "Mẹo đánh bắt", tag: "đánh bắt" },
                      { label: "Bảo quản hải sản", tag: "bảo quản" },
                      { label: "Chế biến món ngon", tag: "chế biến" },
                      { label: "Giá vựa cá", tag: "giá cá" },
                      { label: "Nhật ký biển", tag: "nhật ký" }
                    ].map((item) => (
                      <button
                        key={item.tag}
                        type="button"
                        onClick={() => {
                          const current = form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
                          if (!current.includes(item.tag)) {
                            setForm({ ...form, tags: [...current, item.tag].join(", ") });
                          }
                        }}
                        style={{
                          padding: "4px 10px", borderRadius: "12px", border: "1px solid #e2e8f0",
                          background: form.tags?.includes(item.tag) ? "#0284c7" : "#f8fafc",
                          color: form.tags?.includes(item.tag) ? "#ffffff" : "#0284c7",
                          fontSize: "0.78rem", fontWeight: "600", cursor: "pointer"
                        }}
                      >
                        +{item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Dropzone Uploader */}
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "#64748b", marginBottom: "6px" }}>Tải lên hình ảnh / video minh họa:</div>
                  <ImageUploader
                    files={form.imageFiles}
                    maxFiles={4}
                    onChange={(files) => setForm({ ...form, imageFiles: files })}
                  />
                </div>

                {/* Manual Tag Input */}
                <input 
                  onChange={(event) => setForm({ ...form, tags: event.target.value })} 
                  placeholder="Thẻ bắt đầu bằng hashtag (ví dụ: cá thu, tôm hùm, cảng cửa lò)" 
                  value={form.tags} 
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                />

                {/* Action Bar & Submit */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px solid #f1f5f9", marginTop: "4px" }}>
                  <button 
                    type="button"
                    onClick={() => setShowEmotionModal(true)}
                    style={{ background: "#fef3c7", border: "none", padding: "6px 12px", borderRadius: "16px", color: "#d97706", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <Sparkles size={14} /> Chọn cảm xúc
                  </button>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button type="button" className="button button--secondary" onClick={() => setFormOpen(false)} style={{ borderRadius: "8px", padding: "8px 14px" }}>Hủy</button>
                    <button className="button button--primary" disabled={savingPost} type="submit" style={{ borderRadius: "8px", padding: "8px 18px", fontWeight: "700" }}>
                      {savingPost ? <><Loader size={15} className="toast-spinner" /> Đang đăng...</> : <><Send size={15} /> Đăng bài viết</>}
                    </button>
                  </div>
                </div>

              </form>
            )}
          </div>

          {/* EDIT POST MODAL */}
          {editingPost && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
              <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "500px", padding: "20px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>Chỉnh sửa bài viết</h3>
                  <button type="button" onClick={() => setEditingPost(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
                </div>
                <form onSubmit={savePost} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input 
                    value={editForm.title} 
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    required
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                  <textarea 
                    value={editForm.content} 
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    required
                    rows="5"
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                  <input 
                    value={editForm.tags} 
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                    <button type="button" className="button button--secondary" onClick={() => setEditingPost(null)}>Hủy</button>
                    <button type="submit" className="button button--primary">Lưu thay đổi</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* FEED POSTS LIST */}
          <div className="community-feed" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredPosts.map((post) => {
              const id = post.id || post._id;
              const authorName = post.userName || "Thành viên HảiSản.vn";
              const isLiked = user && post.likes?.map(String).includes(String(user.id || user._id));
              
              return (
                <article key={id} style={{ background: "#ffffff", borderRadius: "16px", padding: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  
                  {/* Post Header */}
                  <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <PostAvatar avatar={post.userAvatar} name={authorName} />
                      <div>
                        <strong style={{ fontSize: "0.95rem", color: "#0f172a", display: "block" }}>{authorName}</strong>
                        <small style={{ color: "#64748b", fontSize: "0.78rem" }}>{formatPostDateTime(post.createdAt)}</small>
                      </div>
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button 
                        type="button" 
                        onClick={() => openEditPost(post)}
                        title="Chỉnh sửa bài viết"
                        style={{ 
                          width: "32px", 
                          height: "32px", 
                          minWidth: "32px", 
                          minHeight: "32px", 
                          padding: 0, 
                          borderRadius: "8px", 
                          border: "1px solid #cbd5e1", 
                          background: "#f8fafc", 
                          color: "#0284c7", 
                          display: "inline-flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          cursor: "pointer", 
                          boxSizing: "border-box", 
                          flexShrink: 0,
                          transition: "all 0.2s ease"
                        }}
                      >
                        <Pencil size={17} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => deletePost(post)}
                        title="Xóa bài viết"
                        style={{ 
                          width: "32px", 
                          height: "32px", 
                          minWidth: "32px", 
                          minHeight: "32px", 
                          padding: 0, 
                          borderRadius: "8px", 
                          border: "1px solid #fca5a5", 
                          background: "#fef2f2", 
                          color: "#ef4444", 
                          display: "inline-flex", 
                          alignItems: "center", 
                          justify: "center", 
                          cursor: "pointer", 
                          boxSizing: "border-box", 
                          flexShrink: 0,
                          transition: "all 0.2s ease"
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </header>

                  {/* Title & Body Content */}
                  <h2 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", margin: "0 0 8px 0" }}>{post.title}</h2>
                  <p style={{ fontSize: "0.92rem", color: "#334155", lineHeight: "1.5", margin: "0 0 12px 0", whiteSpace: "pre-line" }}>{post.content}</p>

                  {/* Collage Images */}
                  <FacebookPostCollage
                    images={post.images}
                    onOpenLightbox={(imgs, idx) => setLightbox({ open: true, images: imgs, index: idx })}
                  />

                  {/* Tags */}
                  {post.tags?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "12px 0" }}>
                      {post.tags.map((tag) => (
                        <span key={tag} style={{ background: "#e0f2fe", color: "#0284c7", padding: "2px 8px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: "600" }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Like & Comment Counts Bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", fontSize: "0.85rem", color: "#64748b", margin: "12px 0" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: "600", color: "#0284c7" }}>
                      ❤️ {post.likeCount ?? post.likes?.length ?? 0} lượt thích
                    </span>
                    <span>{post.comments?.length || 0} bình luận</span>
                  </div>

                  {/* Action Buttons: Like, Comment, Report */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => toggleLike(post)}
                      style={{
                        flex: 1, padding: "8px", borderRadius: "8px", border: "none",
                        background: isLiked ? "#ffe4e6" : "#f8fafc", color: isLiked ? "#e11d48" : "#475569",
                        fontWeight: "700", fontSize: "0.88rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer"
                      }}
                    >
                      <Heart size={16} fill={isLiked ? "#e11d48" : "none"} /> {isLiked ? "Đã thích" : "Thích"}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleComments(id)}
                      style={{
                        flex: 1, padding: "8px", borderRadius: "8px", border: "none",
                        background: expandedComments[id] ? "#e0f2fe" : "#f8fafc", color: expandedComments[id] ? "#0284c7" : "#475569",
                        fontWeight: "700", fontSize: "0.88rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer"
                      }}
                    >
                      <MessageCircle size={16} /> Bình luận
                    </button>
                  </div>

                  {/* Comments List & Add Comment Box */}
                  {expandedComments[id] && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                        {post.comments?.map((comment) => (
                          <div key={comment._id || `${comment.userId}-${comment.createdAt}`} style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "10px", fontSize: "0.88rem" }}>
                            <strong style={{ color: "#0f172a" }}>{comment.userName}: </strong>
                            <span style={{ color: "#334155" }}>{comment.text}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          placeholder="Viết bình luận bài viết..."
                          value={comments[id] || ""}
                          onChange={(e) => setComments({ ...comments, [id]: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") addComment(post); }}
                          style={{ flex: 1, padding: "8px 12px", borderRadius: "20px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                        />
                        <button
                          type="button"
                          onClick={() => addComment(post)}
                          style={{ background: "#0284c7", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "20px", fontWeight: "700", cursor: "pointer" }}
                        >
                          Gửi
                        </button>
                      </div>
                    </div>
                  )}

                </article>
              );
            })}
          </div>

        </main>

        {/* ── CỘT 3: RIGHT SIDEBAR ADS & BẢNG XẾP HẠNG NGƯ DÂN ── */}
        <aside className="fb-right-column fb-sticky-sidebar">
          <AdBanner targetRole="buyer" />
          <div className="fb-sidebar-card" style={{ background: "#ffffff", padding: "16px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <h3 className="fb-sidebar-title" style={{ fontSize: "1.05rem", fontWeight: "800", margin: "0 0 14px 0", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
              <Trophy size={18} color="#f59e0b" /> Xếp Hạng Ngư Dân
            </h3>

            <div className="fb-rank-seller-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {rankedSellers.map((seller, index) => {
                const sellerId = String(seller.id || seller._id || "");
                const isFollowed = followedIds.has(sellerId);
                const rankColor = index === 0 ? "#f59e0b" : index === 1 ? "#94a3b8" : index === 2 ? "#d97706" : "#64748b";
                const rankLabel = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;

                return (
                  <div key={sellerId || index} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: "800", color: rankColor, width: "20px", textAlign: "center", flexShrink: 0 }}>
                      {rankLabel}
                    </span>

                    <Link 
                      to={`/fisherman/${sellerId}`} 
                      title={`Xem trang cá nhân của ${seller.name}`}
                      style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0, textDecoration: "none" }}
                    >
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#0284c7", color: "#fff", display: "grid", placeItems: "center", fontWeight: "700", fontSize: "0.78rem", overflow: "hidden", flexShrink: 0 }}>
                        {seller.avatar || seller.avatarUrl ? (
                          <img src={seller.avatar || seller.avatarUrl} alt={seller.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          getInitials(seller.name)
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                        <span style={{ color: "#0f172a", fontSize: "0.82rem", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {seller.name}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#64748b", display: "flex", alignItems: "center", gap: "3px" }}>
                          <Star size={11} fill="#f59e0b" color="#f59e0b" /> {seller.avgRating || seller.ratingAvg || "4.8"} • {seller.location || seller.origin || seller.address || "Đà Nẵng"}
                        </span>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFollowSeller(sellerId);
                      }}
                      style={{
                        border: "none",
                        borderRadius: "6px",
                        padding: "4px 7px",
                        background: isFollowed ? "#e0f2fe" : "#0284c7",
                        color: isFollowed ? "#0284c7" : "#ffffff",
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "3px"
                      }}
                    >
                      {isFollowed ? <UserCheck size={11} /> : <UserPlus size={11} />}
                      {isFollowed ? "Đã theo" : "Theo dõi"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

      </div>

      {/* EMOTION SELECTION MODAL */}
      {showEmotionModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "400px", padding: "20px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800" }}>Chọn cảm xúc chia sẻ</h3>
              <button type="button" onClick={() => setShowEmotionModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {EMOTIONS_LIST.map((emo) => (
                <button
                  key={emo.label}
                  type="button"
                  onClick={() => { setSelectedEmotion(emo.label); setShowEmotionModal(false); }}
                  style={{
                    padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", background: selectedEmotion === emo.label ? "#e0f2fe" : "#f8fafc",
                    color: selectedEmotion === emo.label ? "#0284c7" : "#0f172a", fontWeight: "600", textAlign: "left", cursor: "pointer"
                  }}
                >
                  {emo.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {lightbox.open && (
        <ImageLightboxModal
          currentIndex={lightbox.index}
          images={lightbox.images}
          onClose={() => setLightbox({ open: false, images: [], index: 0 })}
          onSelectIndex={(index) => setLightbox((prev) => ({ ...prev, index }))}
        />
      )}
    </div>
  );
}
