import { useEffect, useState, useCallback } from "react";
import { 
  Camera, Save, ShieldCheck, Trash2, User, Bookmark, 
  ShoppingBag, Heart, ExternalLink, Crown, Anchor, Ship, 
  Plus, CheckCircle2, QrCode, Sparkles, RefreshCw, MapPin, 
  Phone, Mail, FileText, Check
} from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  apiAuth, apiFavorites, apiProducts, 
  apiLandingBatches, apiBoatLogs, apiPayment 
} from "../services/api";
import useSEO from "../hooks/useSEO";
import { formatCurrency, getProductId, getProductImage } from "../utils/product";

function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Profile({ initialTab: propInitialTab }) {
  useSEO("Hồ sơ cá nhân & Khu vực làm việc", "Trang hồ sơ cá nhân, khu vực làm việc, sản phẩm đã lưu và tài khoản Premium trên HảiSản.vn.");
  
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultTab = propInitialTab || searchParams.get("tab") || "account";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Form State
  const [form, setForm] = useState({ name: "", email: "", phone: "", locationName: "" });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  // Saved Items State
  const [savedItems, setSavedItems] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Workspace Data State
  const [myProducts, setMyProducts] = useState([]);
  const [myBatches, setMyBatches] = useState([]);
  const [myLogs, setMyLogs] = useState([]);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);

  // Premium Payment State
  const [premiumIntent, setPremiumIntent] = useState(null);
  const [premiumStatus, setPremiumStatus] = useState(null);
  const [loadingPremium, setLoadingPremium] = useState(false);

  useEffect(() => {
    if (propInitialTab) {
      setActiveTab(propInitialTab);
    } else {
      const urlTab = searchParams.get("tab");
      if (urlTab) setActiveTab(urlTab);
    }
  }, [propInitialTab, searchParams]);

  useEffect(() => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      locationName: user?.locationName || user?.location || "",
    });
    setPreview(user?.avatar || user?.avatarUrl || "");
  }, [user]);

  // Load Tab Data On Demand
  useEffect(() => {
    if (!user) return;

    if (activeTab === "saved") {
      setLoadingSaved(true);
      apiFavorites.getAll()
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.data || data?.favorites || [];
          setSavedItems(list);
        })
        .catch(() => setSavedItems([]))
        .finally(() => setLoadingSaved(false));
    }

    if (activeTab === "workspace") {
      setLoadingWorkspace(true);
      Promise.allSettled([
        apiProducts.getMine(),
        apiLandingBatches.getMine(),
        apiBoatLogs.getAll({ limit: 10 })
      ]).then(([prodRes, batchRes, logRes]) => {
        if (prodRes.status === "fulfilled") {
          const prods = Array.isArray(prodRes.value) ? prodRes.value : prodRes.value?.data || prodRes.value?.products || [];
          setMyProducts(prods);
        }
        if (batchRes.status === "fulfilled") {
          const batches = Array.isArray(batchRes.value) ? batchRes.value : batchRes.value?.data || batchRes.value?.landingBatches || [];
          setMyBatches(batches);
        }
        if (logRes.status === "fulfilled") {
          const logs = Array.isArray(logRes.value) ? logRes.value : logRes.value?.data || logRes.value?.boatLogs || [];
          setMyLogs(logs);
        }
      }).finally(() => setLoadingWorkspace(false));
    }

    if (activeTab === "premium") {
      setLoadingPremium(true);
      Promise.allSettled([
        apiPayment.getPremiumIntent(),
        apiPayment.getStatus()
      ]).then(([intentRes, statusRes]) => {
        if (intentRes.status === "fulfilled") setPremiumIntent(intentRes.value);
        if (statusRes.status === "fulfilled") setPremiumStatus(statusRes.value);
      }).finally(() => setLoadingPremium(false));
    }
  }, [activeTab, user]);

  const changeTab = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
  };

  const selectAvatar = (event) => {
    const file = event.target.files?.[0] || null;
    setAvatar(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("email", form.email);
      if (form.phone) data.append("phone", form.phone);
      if (form.locationName) data.append("locationName", form.locationName);
      if (avatar) data.append("avatar", avatar);

      await apiAuth.updateProfile(data);
      const profile = await apiAuth.getProfile();
      login(profile);
      setAvatar(null);
      setNotice("Đã cập nhật thông tin hồ sơ thành công.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };

  const removeSavedItem = async (productId) => {
    try {
      await apiFavorites.toggle(productId);
      setSavedItems((prev) => prev.filter((item) => String(item.id || item._id) !== String(productId)));
    } catch (e) {
      console.error("Failed to remove saved item:", e);
    }
  };

  const removeAccount = async () => {
    const confirmation = window.prompt('Nhập "XOA TAI KHOAN" để xác nhận xóa vĩnh viễn dữ liệu:');
    if (confirmation !== "XOA TAI KHOAN") return;
    setBusy(true);
    try {
      await apiAuth.deleteAccount();
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      setNotice(error.message);
      setBusy(false);
    }
  };

  return (
    <div className="page-container fb-profile-page" style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* ── PROFILE HERO BANNER & HEADER ── */}
      <section 
        className="fb-profile-header-card" 
        style={{ 
          background: "#ffffff", 
          borderRadius: "20px", 
          overflow: "hidden", 
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)", 
          marginBottom: "1.5rem",
          border: "1px solid #e2e8f0"
        }}
      >
        <div 
          className="fb-cover-banner" 
          style={{ 
            height: "190px", 
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 40%, #0d9488 100%)",
            position: "relative"
          }}
        >
          <div style={{ position: "absolute", inset: 0, opacity: 0.15, background: "radial-gradient(circle, #ffffff 10%, transparent 11%)", backgroundSize: "20px 20px" }} />
        </div>

        <div className="fb-profile-info-row" style={{ padding: "0 2rem 1.5rem", display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "1.5rem", marginTop: "-60px" }}>
          <div className="fb-avatar-box-lg" style={{ position: "relative" }}>
            <div style={{ width: "124px", height: "124px", borderRadius: "50%", border: "4px solid #ffffff", overflow: "hidden", background: "linear-gradient(135deg, #0284c7, #14b8a6)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.3rem", fontWeight: "800", boxShadow: "0 6px 16px rgba(0,0,0,0.12)" }}>
              {preview ? <img src={preview} alt={user?.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : getInitials(user?.name)}
            </div>
            <label className="fb-avatar-camera-btn" style={{ position: "absolute", bottom: "4px", right: "4px", width: "36px", height: "36px", borderRadius: "50%", background: "#ffffff", color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }} title="Đổi ảnh đại diện">
              <Camera size={18} />
              <input accept="image/jpeg,image/png,image/webp" hidden onChange={selectAvatar} type="file" />
            </label>
          </div>

          <div className="fb-user-details" style={{ flex: "1 1 260px", marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: "800", color: "#0f172a" }}>
                {user?.name || "Người dùng"}
              </h1>
              {user?.isVerified && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#e0f2fe", color: "#0284c7", padding: "4px 10px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: "700" }}>
                  <ShieldCheck size={14} /> Đã xác thực
                </span>
              )}
              {user?.isPremium && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#fef3c7", color: "#d97706", padding: "4px 10px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: "800" }}>
                  <Crown size={14} /> Premium
                </span>
              )}
            </div>
            <p style={{ margin: "6px 0 0", color: "#64748b", fontWeight: "500", fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span>Vai trò: <strong style={{ color: "#0284c7" }}>{user?.role === "Seller" || user?.role === "seller" ? "Ngư dân / Chủ vựa" : user?.role === "Admin" ? "Quản trị viên" : "Người mua"}</strong></span>
              {(user?.locationName || user?.location) && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={14} color="#64748b" /> {user.locationName || user.location}</span>
              )}
              {user?.phone && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Phone size={14} color="#64748b" /> {user.phone}</span>
              )}
            </p>
          </div>

          <div className="fb-profile-action-btns" style={{ display: "flex", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <button 
              type="button" 
              onClick={() => changeTab("workspace")} 
              className={`button ${activeTab === "workspace" ? "button--primary" : "button--secondary"}`}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <ShoppingBag size={16} /> Khu vực làm việc
            </button>
            <button 
              type="button" 
              onClick={() => changeTab("premium")} 
              className={`button ${activeTab === "premium" ? "button--primary" : "button--ghost"}`}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", border: "1px solid #f59e0b", color: "#d97706", background: activeTab === "premium" ? "#fef3c7" : "transparent" }}
            >
              <Crown size={16} /> Premium
            </button>
          </div>
        </div>

        {/* ── UNIFIED TABS BAR ── */}
        <div className="fb-profile-tabs-bar" style={{ display: "flex", gap: "0.5rem", padding: "0 1.5rem", borderTop: "1px solid #f1f5f9", overflowX: "auto" }}>
          <button
            type="button"
            className={`fb-profile-tab ${activeTab === "account" ? "is-active" : ""}`}
            onClick={() => changeTab("account")}
            style={{
              padding: "12px 18px", border: "none", background: "none",
              borderBottom: activeTab === "account" ? "3px solid #0284c7" : "3px solid transparent",
              color: activeTab === "account" ? "#0284c7" : "#64748b", fontWeight: "700",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem"
            }}
          >
            <User size={16} /> Hồ sơ & Cài đặt
          </button>

          <button
            type="button"
            className={`fb-profile-tab ${activeTab === "workspace" ? "is-active" : ""}`}
            onClick={() => changeTab("workspace")}
            style={{
              padding: "12px 18px", border: "none", background: "none",
              borderBottom: activeTab === "workspace" ? "3px solid #0284c7" : "3px solid transparent",
              color: activeTab === "workspace" ? "#0284c7" : "#64748b", fontWeight: "700",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem"
            }}
          >
            <ShoppingBag size={16} /> Khu vực làm việc
          </button>

          <button
            type="button"
            className={`fb-profile-tab ${activeTab === "saved" ? "is-active" : ""}`}
            onClick={() => changeTab("saved")}
            style={{
              padding: "12px 18px", border: "none", background: "none",
              borderBottom: activeTab === "saved" ? "3px solid #0284c7" : "3px solid transparent",
              color: activeTab === "saved" ? "#0284c7" : "#64748b", fontWeight: "700",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem"
            }}
          >
            <Bookmark size={16} /> Mục đã lưu ({savedItems.length})
          </button>

          <button
            type="button"
            className={`fb-profile-tab ${activeTab === "premium" ? "is-active" : ""}`}
            onClick={() => changeTab("premium")}
            style={{
              padding: "12px 18px", border: "none", background: "none",
              borderBottom: activeTab === "premium" ? "3px solid #f59e0b" : "3px solid transparent",
              color: activeTab === "premium" ? "#d97706" : "#64748b", fontWeight: "700",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem"
            }}
          >
            <Crown size={16} color="#f59e0b" /> Hội viên Premium
          </button>
        </div>
      </section>

      {notice && <p className="inline-notice" style={{ marginBottom: "1.25rem", padding: "12px", borderRadius: "10px", background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0369a1" }}>{notice}</p>}

      {/* ── TAB 1: ACCOUNT & PERSONAL PROFILE ── */}
      {activeTab === "account" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <section className="dashboard-panel" style={{ background: "#ffffff", borderRadius: "16px", padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "1.25rem", margin: "0 0 1.25rem", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={20} color="#0284c7" /> Thông tin cá nhân
            </h2>
            <form className="form-grid" onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <label className="form-field">
                <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>Họ và tên</span>
                <input minLength="2" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required value={form.name} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
              </label>
              <label className="form-field">
                <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>Địa chỉ Email</span>
                <input onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required type="email" value={form.email} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
              </label>
              <label className="form-field">
                <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>Số điện thoại liên hệ</span>
                <input placeholder="Nhập số điện thoại" onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} value={form.phone} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
              </label>
              <label className="form-field">
                <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>Tỉnh / Thành phố hoặc Cảng cá</span>
                <input placeholder="VD: Đà Nẵng · Cảng Thọ Quang" onChange={(event) => setForm((current) => ({ ...current, locationName: event.target.value }))} value={form.locationName} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }} />
              </label>
              <div style={{ gridColumn: "1 / -1", marginTop: "8px", display: "flex", justifyContent: "flex-end" }}>
                <button className="button button--primary" disabled={busy} type="submit" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 24px", borderRadius: "10px", fontWeight: "700" }}>
                  <Save size={16} /> Lưu thay đổi hồ sơ
                </button>
              </div>
            </form>
          </section>

          <section className="dashboard-panel danger-zone" style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: "16px", padding: "1.5rem" }}>
            <div>
              <h3 style={{ color: "#9b2c2c", margin: "0 0 4px", fontSize: "1.1rem" }}>Xóa tài khoản cá nhân</h3>
              <p className="muted-copy" style={{ color: "#c53030", margin: 0, fontSize: "0.88rem" }}>
                Thao tác này sẽ xóa vĩnh viễn toàn bộ dữ liệu tài khoản, danh sách bài niêm yết và tin nhắn của bạn. Thao tác không thể khôi phục.
              </p>
            </div>
            <button className="button button--danger" disabled={busy} onClick={removeAccount} type="button" style={{ marginTop: "1rem", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Trash2 size={16} /> Xóa tài khoản vĩnh viễn
            </button>
          </section>
        </div>
      )}

      {/* ── TAB 2: KHU VỰC LÀM VIỆC (WORKSPACE) ── */}
      {activeTab === "workspace" && (
        <section className="dashboard-panel" style={{ background: "#ffffff", borderRadius: "16px", padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", margin: 0, fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <ShoppingBag size={22} color="#0284c7" /> Khu vực làm việc Ngư Dân & Thị Trường
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>Tổng quan sản phẩm niêm yết, mẻ vựa cá cập bến và nhật ký đi biển của bạn.</p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Link to="/seller/landing-batches/new" className="button button--primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.88rem" }}>
                <Plus size={16} /> Đăng mẻ vựa cá
              </Link>
              <Link to="/seller/boat-log" className="button button--secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.88rem" }}>
                <Anchor size={16} /> Nhật ký biển
              </Link>
            </div>
          </header>

          {loadingWorkspace ? (
            <p style={{ color: "#64748b" }}>Đang tải dữ liệu làm việc...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              {/* Workspace Metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", padding: "1rem", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#0284c7", color: "#fff", display: "grid", placeItems: "center" }}><ShoppingBag size={20} /></div>
                  <div><strong style={{ fontSize: "1.25rem", color: "#0369a1", display: "block" }}>{myProducts.length}</strong><span style={{ fontSize: "0.85rem", color: "#0369a1" }}>Sản phẩm đang bán</span></div>
                </div>

                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1rem", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#16a34a", color: "#fff", display: "grid", placeItems: "center" }}><Ship size={20} /></div>
                  <div><strong style={{ fontSize: "1.25rem", color: "#15803d", display: "block" }}>{myBatches.length}</strong><span style={{ fontSize: "0.85rem", color: "#15803d" }}>Vựa cá cập bến</span></div>
                </div>

                <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", padding: "1rem", borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#9333ea", color: "#fff", display: "grid", placeItems: "center" }}><Anchor size={20} /></div>
                  <div><strong style={{ fontSize: "1.25rem", color: "#7e22ce", display: "block" }}>{myLogs.length}</strong><span style={{ fontSize: "0.85rem", color: "#7e22ce" }}>Nhật ký chuyến biển</span></div>
                </div>
              </div>

              {/* My Products List */}
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: "0 0 1rem 0", color: "#0f172a" }}>Sản phẩm niêm yết của bạn ({myProducts.length})</h3>
                {myProducts.length === 0 ? (
                  <div style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", padding: "2rem", borderRadius: "12px", textAlign: "center" }}>
                    <ShoppingBag size={28} color="#64748b" style={{ marginBottom: "8px" }} />
                    <p style={{ margin: 0, color: "#64748b" }}>Bạn chưa đăng niêm yết sản phẩm nào.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
                    {myProducts.map((p) => (
                      <div key={getProductId(p)} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", background: "#fff", display: "flex", flexDirection: "column" }}>
                        <img src={getProductImage(p)} alt={p.name} style={{ width: "100%", height: "140px", objectFit: "cover" }} />
                        <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column" }}>
                          <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{p.name}</strong>
                          <span style={{ color: "#0284c7", fontWeight: "700", margin: "4px 0 8px" }}>{formatCurrency(p.price)} / kg</span>
                          <Link to={`/product/${getProductId(p)}`} className="button button--ghost" style={{ marginTop: "auto", fontSize: "0.82rem", textAlign: "center" }}>Xem bài niêm yết</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── TAB 3: MỤC ĐÃ LƯU (SAVED ITEMS) ── */}
      {activeTab === "saved" && (
        <section className="dashboard-panel" style={{ background: "#ffffff", borderRadius: "16px", padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", margin: 0, fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <Bookmark size={22} color="#0284c7" /> Danh sách sản phẩm hải sản đã lưu
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" }}>Các mẻ hải sản tươi ngon bạn đánh dấu thả tim để xem lại và liên hệ mua.</p>
            </div>
          </div>

          {loadingSaved ? (
            <p style={{ color: "#64748b" }}>Đang tải danh sách đã lưu...</p>
          ) : savedItems.length === 0 ? (
            <div className="empty-state-card" style={{ padding: "3rem 1rem", textAlign: "center" }}>
              <div className="empty-state-icon" style={{ display: "inline-flex", padding: "1rem", borderRadius: "50%", background: "#f0f9ff", color: "#0284c7", marginBottom: "1rem" }}>
                <Bookmark size={32} />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Chưa có hải sản nào được lưu</h3>
              <p style={{ color: "#64748b", maxWidth: "400px", margin: "0.5rem auto 1.25rem" }}>
                Bấm vào biểu tượng thả tim ở sản phẩm hải sản bất kỳ để lưu trữ tại đây và xem lại nhanh chóng.
              </p>
              <Link to="/marketplace" className="button button--primary">Khám phá Chợ Hải Sản</Link>
            </div>
          ) : (
            <div className="saved-items-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.25rem" }}>
              {savedItems.map((item) => {
                const id = getProductId(item);
                return (
                  <div key={id} style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", background: "#ffffff", display: "flex", flexDirection: "column", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                    <div style={{ height: "160px", background: "#f8fafc", position: "relative" }}>
                      <img src={getProductImage(item)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => removeSavedItem(id)}
                        title="Bỏ lưu"
                        style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(255,255,255,0.95)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#ef4444", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                      >
                        <Heart size={18} fill="#ef4444" />
                      </button>
                    </div>
                    <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
                      <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "#0f172a" }}>{item.name}</h4>
                      <p style={{ margin: "4px 0 8px", color: "#0284c7", fontWeight: "800", fontSize: "1.05rem" }}>{formatCurrency(item.price)} / kg</p>
                      <small style={{ color: "#64748b", marginBottom: "1rem" }}>{item.sellerName || "Ngư dân"}</small>
                      <Link to={`/product/${id}`} className="button button--secondary" style={{ marginTop: "auto", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        Xem chi tiết <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── TAB 4: HỘI VIÊN PREMIUM (PREMIUM MEMBERSHIP) ── */}
      {activeTab === "premium" && (
        <section className="dashboard-panel" style={{ background: "#ffffff", borderRadius: "16px", padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #fef3c7" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <span className="eyebrow" style={{ color: "#d97706" }}>GÓI HỘI VIÊN CAO CẤP</span>
              <h2 style={{ fontSize: "1.3rem", margin: "4px 0 0 0", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <Crown size={24} color="#f59e0b" /> Quyền lợi & Nâng cấp Premium
              </h2>
            </div>
            <Link to="/premium" className="button button--primary" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none" }}>
              <Sparkles size={16} /> Nâng cấp Premium ngay
            </Link>
          </header>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {/* Status Card */}
            <div style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7)", border: "1px solid #fde68a", padding: "1.5rem", borderRadius: "14px" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "#92400e", fontSize: "1.1rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                <Crown size={20} color="#d97706" /> Trạng thái tài khoản của bạn
              </h3>
              <p style={{ fontSize: "1rem", margin: "0 0 12px 0", color: "#78350f" }}>
                Gói hiện tại: <strong style={{ color: user?.isPremium ? "#d97706" : "#0284c7" }}>{user?.isPremium ? "Hội viên Premium 👑" : "Tài khoản Thường"}</strong>
              </p>
              <ul style={{ margin: 0, paddingLeft: "20px", color: "#78350f", fontSize: "0.92rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li>Huy hiệu Ngư dân Premium nổi bật uy tín.</li>
                <li>Đăng bài niêm yết vựa cá không giới hạn.</li>
                <li>Ưu tiên vị trí hiển thị top đầu Chợ Hải Sản.</li>
                <li>Gửi tin nhắn liên hệ trực tiếp không giới hạn.</li>
              </ul>
            </div>

            {/* Premium Benefits overview */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "1.5rem", borderRadius: "14px" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "#0f172a", fontSize: "1.1rem", fontWeight: "700" }}>
                Thông tin thanh toán nâng cấp
              </h3>
              <p style={{ margin: "0 0 12px 0", fontSize: "0.9rem", color: "#64748b" }}>
                Phí đăng ký Premium: <strong>199.000đ / tháng</strong>. Chuyển khoản ngân hàng tự động duyệt trong 1 phút.
              </p>
              <div style={{ padding: "12px", background: "#ffffff", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.88rem", color: "#334155" }}>
                <div>Ngân hàng: <strong>Vietcombank</strong></div>
                <div>Số tài khoản: <strong>1037922073</strong></div>
                <div>Chủ tài khoản: <strong>To Minh Cuong</strong></div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
