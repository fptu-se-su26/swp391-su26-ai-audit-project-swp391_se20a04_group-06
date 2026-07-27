import { useState, useEffect } from "react";
import { 
  Search, Bell, MessageSquare, ShieldCheck, ShoppingBag, Tag, Plus, MapPin, 
  Car, Home, Fish, Anchor, ExternalLink, Compass, ChevronRight, X 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiProducts } from "../services/api";
import { formatCurrency, getProductId, getProductImage } from "../utils/product";
import useSEO from "../hooks/useSEO";

const SHOPEE_DEMO_URL = "https://shopee.vn/(-1-xanh-1-%C4%90%E1%BB%8E)-COMBO-N%C6%AF%E1%BB%9AC-CH%E1%BA%A4M-H%E1%BA%A2I-S%E1%BA%A2N-XANH-%C4%90%E1%BB%8E-TH%E1%BB%8A-B%C3%94NG-(-chai-330ml-i.628058054.40900363017?extraParams=%7B%22display_model_id%22%3A139367593797%2C%22model_selection_logic%22%3A3%7D";

export default function SettingsManagement() {
  useSEO("Cài đặt & Quản lý Marketplace", "Trang quản lý cài đặt tài khoản và niêm yết bài đăng chuẩn phong cách Facebook Marketplace.");
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentLocation, setCurrentLocation] = useState("Đà Nẵng · Trong vòng 65 km");
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    apiProducts.getAll({ limit: 100 }).then((data) => {
      const list = Array.isArray(data) ? data : data?.data || data?.products || [];
      setProducts(list);
    }).catch((err) => console.error("Error loading products:", err));

    apiProducts.getMine().then((data) => {
      const list = Array.isArray(data) ? data : data?.data || data?.products || [];
      setMyProducts(list);
    }).catch(() => {});
  }, []);

  const sourceProducts = activeTab === "selling" ? myProducts : products;

  const allItems = sourceProducts.map((p) => ({
    id: getProductId(p),
    title: p.name || "Hải sản tươi sống",
    price: p.price || 0,
    location: p.origin || p.locationName || "Việt Nam",
    image: getProductImage(p),
    sellerName: p.sellerName || "Ngư dân Việt",
    category: p.category || "fish",
    isSeafood: true,
  }));

  // Filtering based on Search, Active Tab & Category
  const filteredItems = allItems.filter(item => {
    const matchesSearch = !searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;

    if (activeTab === "buying") {
      return matchesSearch && matchesCategory;
    }
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="settings-management-page page-container" style={{ paddingTop: "1rem", paddingBottom: "2rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px", alignItems: "start" }}>
        
        {/* LEFT COLUMN: Facebook Marketplace Navigation Sidebar */}
        <aside style={{ background: "#ffffff", borderRadius: "16px", padding: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", position: "sticky", top: "72px" }}>
          
          {/* Header Title (Clean without Setting Cog Icon) */}
          <div style={{ marginBottom: "16px" }}>
            <h1 style={{ fontSize: "1.4rem", fontWeight: "800", margin: 0, color: "#0f172a" }}>Marketplace</h1>
          </div>

          {/* Search Box */}
          <div style={{ position: "relative", marginBottom: "16px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm trên Marketplace"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", paddingLeft: "36px", height: "40px", borderRadius: "20px", border: "none", background: "#f0f2f5", fontSize: "0.9rem", color: "#0f172a" }}
            />
          </div>

          {/* Navigation Links List (ALL PERFECTLY LEFT-ALIGNED IN A STRAIGHT LINE) */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <button
              type="button"
              onClick={() => { setActiveTab("all"); setSelectedCategory("all"); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "12px", width: "100%", padding: "10px 12px", borderRadius: "10px",
                background: activeTab === "all" ? "#e7f3ff" : "transparent", color: activeTab === "all" ? "#1877f2" : "#050505",
                fontWeight: activeTab === "all" ? "700" : "500", border: "none", cursor: "pointer", textAlign: "left"
              }}
            >
              <div className="fb-3d-icon fb-3d-icon--cyan" style={{ width: "36px", height: "36px", flexShrink: 0 }}>
                <Compass size={20} />
              </div>
              <span style={{ fontSize: "0.95rem", textAlign: "left" }}>Lướt xem tất cả</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/notifications")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "12px", width: "100%", padding: "10px 12px", borderRadius: "10px",
                background: "transparent", color: "#050505", fontWeight: "500", border: "none", cursor: "pointer", textAlign: "left"
              }}
            >
              <div className="fb-3d-icon fb-3d-icon--rose" style={{ width: "36px", height: "36px", flexShrink: 0 }}>
                <Bell size={20} />
              </div>
              <span style={{ fontSize: "0.95rem", textAlign: "left" }}>Thông báo</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/chat")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "12px", width: "100%", padding: "10px 12px", borderRadius: "10px",
                background: "transparent", color: "#050505", fontWeight: "500", border: "none", cursor: "pointer", textAlign: "left"
              }}
            >
              <div className="fb-3d-icon fb-3d-icon--blue" style={{ width: "36px", height: "36px", flexShrink: 0 }}>
                <MessageSquare size={20} />
              </div>
              <span style={{ fontSize: "0.95rem", textAlign: "left" }}>Hộp thư (Tin nhắn)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("access")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "12px", width: "100%", padding: "10px 12px", borderRadius: "10px",
                background: activeTab === "access" ? "#e7f3ff" : "transparent", color: activeTab === "access" ? "#1877f2" : "#050505",
                fontWeight: activeTab === "access" ? "700" : "500", border: "none", cursor: "pointer", textAlign: "left"
              }}
            >
              <div className="fb-3d-icon fb-3d-icon--purple" style={{ width: "36px", height: "36px", flexShrink: 0 }}>
                <ShieldCheck size={20} />
              </div>
              <span style={{ fontSize: "0.95rem", textAlign: "left" }}>Quyền truy cập Marketplace</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("buying")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "12px", width: "100%", padding: "10px 12px", borderRadius: "10px",
                background: activeTab === "buying" ? "#e7f3ff" : "transparent", color: activeTab === "buying" ? "#1877f2" : "#050505",
                fontWeight: activeTab === "buying" ? "700" : "500", border: "none", cursor: "pointer", textAlign: "left"
              }}
            >
              <div className="fb-3d-icon fb-3d-icon--magenta" style={{ width: "36px", height: "36px", flexShrink: 0 }}>
                <ShoppingBag size={20} />
              </div>
              <span style={{ fontSize: "0.95rem", flex: 1, textAlign: "left" }}>Đang mua</span>
              <ChevronRight size={16} color="#64748b" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("selling")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "12px", width: "100%", padding: "10px 12px", borderRadius: "10px",
                background: activeTab === "selling" ? "#e7f3ff" : "transparent", color: activeTab === "selling" ? "#1877f2" : "#050505",
                fontWeight: activeTab === "selling" ? "700" : "500", border: "none", cursor: "pointer", textAlign: "left"
              }}
            >
              <div className="fb-3d-icon fb-3d-icon--orange" style={{ width: "36px", height: "36px", flexShrink: 0 }}>
                <Tag size={20} />
              </div>
              <span style={{ fontSize: "0.95rem", flex: 1, textAlign: "left" }}>Đang bán</span>
              <ChevronRight size={16} color="#64748b" />
            </button>
          </nav>

          {/* Big Blue + Create Listing Button */}
          <button
            type="button"
            onClick={() => navigate("/seller")}
            style={{
              width: "100%", marginTop: "12px", padding: "10px", borderRadius: "10px", background: "#e7f3ff", color: "#1877f2",
              fontWeight: "700", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "0.95rem"
            }}
          >
            <Plus size={18} /> + Tạo bài niêm yết mới
          </button>

          <div style={{ height: "1px", background: "#e2e8f0", margin: "16px 0" }} />

          {/* Location Section */}
          <div style={{ marginBottom: "12px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "700", margin: "0 0 8px 0", color: "#0f172a" }}>Vị trí</h3>
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              style={{
                background: "none", border: "none", padding: "4px 8px", color: "#1877f2", fontWeight: "600",
                fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", textAlign: "left", width: "100%"
              }}
            >
              <span className="fb-3d-icon fb-3d-icon--red" style={{ width: "32px", height: "32px", flexShrink: 0 }}><MapPin size={16} /></span>
              <span style={{ textAlign: "left" }}>{currentLocation}</span>
            </button>
          </div>

          <div style={{ height: "1px", background: "#e2e8f0", margin: "16px 0" }} />

          {/* Categories Section (STRAIGHT ALIGNED) */}
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: "700", margin: "0 0 12px 0", color: "#0f172a" }}>Hạng mục</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {[
                { id: "fish", label: "Cá tươi", tone: "teal" },
                { id: "shrimp", label: "Tôm các loại", tone: "orange" },
                { id: "crab", label: "Cua - Ghẹ", tone: "red" },
                { id: "squid", label: "Mực - Bạch tuộc", tone: "purple" },
                { id: "shellfish", label: "Ngaêu - Sò - Ốc", tone: "cyan" },
                { id: "other", label: "Hải sản khác", tone: "blue" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? "all" : cat.id)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "12px", width: "100%", padding: "8px 10px", borderRadius: "10px",
                    background: selectedCategory === cat.id ? "#e0f2fe" : "transparent",
                    color: selectedCategory === cat.id ? "#0284c7" : "#334155",
                    fontWeight: selectedCategory === cat.id ? "700" : "500", border: "none", cursor: "pointer", textAlign: "left"
                  }}
                >
                  <div className={`fb-3d-icon fb-3d-icon--${cat.tone}`} style={{ width: "32px", height: "32px", flexShrink: 0 }}><Fish size={16} /></div>
                  <span style={{ fontSize: "0.9rem", textAlign: "left" }}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

        </aside>

        {/* RIGHT COLUMN: Main Content Area */}
        <main>
          {/* Header depending on activeTab */}
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "800", margin: 0, color: "#0f172a" }}>
                {activeTab === "access" && "Quyền Truy Cập Marketplace"}
                {activeTab === "buying" && "Mặt Hàng Đang Mua & Đã Lưu"}
                {activeTab === "selling" && "Mặt Hàng Bạn Đang Niêm Yết Bán"}
                {activeTab === "all" && "Lựa chọn hôm nay"}
              </h2>
              {selectedCategory !== "all" && (
                <small style={{ color: "#0284c7", fontWeight: "600" }}>Đang lọc theo hạng mục: {selectedCategory}</small>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              style={{ background: "none", border: "none", color: "#0284c7", fontWeight: "600", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
            >
              <MapPin size={15} /> {currentLocation}
            </button>
          </header>

          {/* Access Status View */}
          {activeTab === "access" ? (
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                <div className="fb-3d-icon fb-3d-icon--purple" style={{ width: "48px", height: "48px" }}>
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>Tài khoản của bạn đã được xác minh quyền truy cập</h3>
                  <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.9rem" }}>Bạn có đầy đủ quyền đăng bán hải sản, mua hàng và trao đổi tin nhắn trên Marketplace.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="button" className="button button--primary" onClick={() => navigate("/seller")}>
                  + Tạo niêm yết bán mới
                </button>
                <button type="button" className="button button--secondary" onClick={() => setActiveTab("all")}>
                  Lướt chợ ngay
                </button>
              </div>
            </div>
          ) : (
            /* Grid of Products for Sale */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  style={{
                    background: "#ffffff", borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0",
                    display: "flex", flexDirection: "column", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", transition: "transform 0.2s"
                  }}
                >
                  {/* Image (Click to View Details) */}
                  <div 
                    onClick={() => navigate(item.isSeafood ? `/marketplace/${item.id}` : "/profile?tab=settings")}
                    style={{ position: "relative", width: "100%", height: "180px", background: "#f1f5f9", cursor: "pointer" }}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {item.isNew && (
                      <span style={{ position: "absolute", top: "8px", left: "8px", background: "rgba(0,0,0,0.6)", color: "#fff", padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600" }}>
                        Mới niêm yết
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: "12px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>
                      {formatCurrency(item.price)}
                    </div>
                    <h3 
                      onClick={() => navigate(item.isSeafood ? `/marketplace/${item.id}` : "/profile?tab=settings")}
                      style={{ fontSize: "0.9rem", fontWeight: "600", color: "#334155", margin: "0 0 6px 0", lineHeight: "1.3", cursor: "pointer", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                    >
                      {item.title}
                    </h3>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "12px" }}>
                      {item.location}
                    </div>

                    {/* Actions: Message Seller + Shopee Demo Link */}
                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => navigate("/chat")}
                        style={{
                          width: "100%", padding: "7px", borderRadius: "8px", background: "#e7f3ff", color: "#1877f2",
                          border: "none", fontWeight: "700", fontSize: "0.82rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                        }}
                      >
                        <MessageSquare size={14} /> Nhắn tin người bán
                      </button>

                      <a
                        href={SHOPEE_DEMO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          width: "100%", padding: "7px", borderRadius: "8px", background: "#ee4d2d", color: "#ffffff",
                          fontWeight: "700", fontSize: "0.82rem", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                        }}
                      >
                        <ExternalLink size={14} /> Mua trên Shopee Demo
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {filteredItems.length === 0 && activeTab !== "access" && (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "32px", textAlign: "center", border: "1px solid #e2e8f0", marginTop: "1rem" }}>
              <p style={{ color: "#64748b", margin: 0 }}>Không tìm thấy mặt hàng nào phù hợp với bộ lọc.</p>
              <button 
                type="button" 
                className="button button--secondary" 
                style={{ marginTop: "12px" }}
                onClick={() => { setSearchTerm(""); setSelectedCategory("all"); setActiveTab("all"); }}
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </main>

      </div>

      {/* LOCATION PICKER MODAL */}
      {showLocationModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "450px", padding: "20px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>Thay đổi vị trí tìm kiếm</h3>
              <button type="button" onClick={() => setShowLocationModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {["Đà Nẵng · Trong vòng 65 km", "Quận Hải Châu · 20 km", "Cảng Thọ Quang · 15 km", "TP. Hồ Chí Minh · 50 km", "Hà Nội · 50 km"].map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => { setCurrentLocation(loc); setShowLocationModal(false); }}
                  style={{
                    padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", background: currentLocation === loc ? "#e7f3ff" : "#f8fafc",
                    color: currentLocation === loc ? "#1877f2" : "#0f172a", fontWeight: "600", textAlign: "left", cursor: "pointer"
                  }}
                >
                  📍 {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
