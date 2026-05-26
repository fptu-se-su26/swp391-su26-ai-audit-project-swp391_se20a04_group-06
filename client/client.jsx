import { useState, useEffect, useRef, useCallback } from "react";

/* ───────────────── DESIGN TOKENS ───────────────── */
const C = {
  ocean: "#0B4F6C",
  oceanL: "#1A7FA0",
  oceanP: "#E6F4F9",
  coral: "#E8643A",
  coralL: "#FDE8E0",
  ok: "#2D7D46",
  okL: "#EAF5EE",
  warn: "#D97706",
  warnL: "#FEF3C7",
  dark: "#1A2332",
  text: "#2D3748",
  muted: "#718096",
  border: "#E2E8F0",
  bg: "#F7F9FC",
  white: "#FFFFFF",
};
const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

/* ═══════════════════════════════════════════
   TOAST SYSTEM  ← thay thế toàn bộ alert()
═══════════════════════════════════════════ */
let _addToast = null;

export function toast(message, type = "info") {
  if (_addToast) _addToast(message, type);
}
toast.success = (msg) => toast(msg, "success");
toast.error = (msg) => toast(msg, "error");
toast.warn = (msg) => toast(msg, "warn");
toast.info = (msg) => toast(msg, "info");

const TOAST_COLORS = {
  success: { bg: "#EAF5EE", border: "#2D7D46", icon: "✅", color: "#1a5c30" },
  error: { bg: "#FEE2E2", border: "#DC2626", icon: "❌", color: "#991B1B" },
  warn: { bg: "#FEF3C7", border: "#D97706", icon: "⚠️", color: "#92400E" },
  info: { bg: "#E6F4F9", border: "#1A7FA0", icon: "ℹ️", color: "#0B4F6C" },
};

function ToastItem({ id, message, type, onRemove }) {
  const [visible, setVisible] = useState(false);
  const s = TOAST_COLORS[type] || TOAST_COLORS.info;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(id), 300);
    }, 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      onClick={() => {
        setVisible(false);
        setTimeout(() => onRemove(id), 300);
      }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        color: s.color,
        borderRadius: 10,
        padding: "12px 16px",
        minWidth: 260,
        maxWidth: 360,
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: 500,
        lineHeight: 1.4,
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(110%)",
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
        {s.icon}
      </span>
      <span style={{ flex: 1 }}>{message}</span>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _addToast = (message, type) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
    };
    return () => {
      _addToast = null;
    };
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "flex-end",
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onRemove={remove} />
      ))}
    </div>
  );
}

/* ───────────────── HOOKS ───────────────── */
function useCountdown(catchTime) {
  const [rem, setRem] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = 24 * 3600000 - (Date.now() - new Date(catchTime).getTime());
      if (diff <= 0) return setRem("Hết hạn");
      const h = Math.floor(diff / 3600000),
        m = Math.floor((diff % 3600000) / 60000);
      setRem(`${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [catchTime]);
  return rem;
}

/* ───────────────── MOCK DATA ───────────────── */
const now = Date.now();
const PRODUCTS_INIT = [
  {
    id: 1,
    type: "Fresh",
    name: "Cá Thu Tươi",
    price: 180000,
    salesType: "Retail",
    totalWeight: 50,
    remainingWeight: 38,
    status: "Active",
    catchTime: new Date(now - 5 * 3600000).toISOString(),
    lat: 20.8449,
    lng: 106.6881,
    sellerId: 2,
    sellerName: "Nguyễn Văn Bình",
    sellerPhone: "0912345678",
    emoji: "🐟",
    desc: "Cá thu vừa cập bến, còn tươi nguyên. Thịt chắc, ngọt nước. Mua buôn liên hệ giảm giá.",
    origin: null,
    expiryDate: null,
    imgCount: 3,
  },
  {
    id: 2,
    type: "Fresh",
    name: "Tôm Hùm Sống",
    price: 850000,
    salesType: "Retail",
    totalWeight: 20,
    remainingWeight: 12,
    status: "Active",
    catchTime: new Date(now - 2 * 3600000).toISOString(),
    lat: 20.86,
    lng: 106.7,
    sellerId: 3,
    sellerName: "Trần Thị Lan",
    sellerPhone: "0987654321",
    emoji: "🦞",
    desc: "Tôm hùm sống, nhập từ tàu đánh cá ngoài khơi. Cam kết tươi sống.",
    origin: null,
    expiryDate: null,
    imgCount: 4,
  },
  {
    id: 3,
    type: "Fresh",
    name: "Cua Biển Gạch Son",
    price: 320000,
    salesType: "Wholesale",
    totalWeight: 30,
    remainingWeight: 30,
    status: "Active",
    catchTime: new Date(now - 8 * 3600000).toISOString(),
    lat: 20.83,
    lng: 106.67,
    sellerId: 4,
    sellerName: "Lê Minh Tuấn",
    sellerPhone: "0934567890",
    emoji: "🦀",
    desc: "Cua biển gạch son, bán nguyên rổ 30kg. Cua cái nhiều gạch.",
    origin: null,
    expiryDate: null,
    imgCount: 2,
  },
  {
    id: 4,
    type: "Fresh",
    name: "Mực Ống Tươi",
    price: 150000,
    salesType: "Retail",
    totalWeight: 40,
    remainingWeight: 40,
    status: "Active",
    catchTime: new Date(now - 1 * 3600000).toISOString(),
    lat: 20.85,
    lng: 106.69,
    sellerId: 2,
    sellerName: "Nguyễn Văn Bình",
    sellerPhone: "0912345678",
    emoji: "🦑",
    desc: "Mực ống tươi rói, vừa kéo lên. Mực ngon, thịt dày.",
    origin: null,
    expiryDate: null,
    imgCount: 3,
  },
  {
    id: 5,
    type: "Dried",
    name: "Mực Khô Phú Quốc",
    price: 680000,
    salesType: "Retail",
    totalWeight: 100,
    remainingWeight: 75,
    status: "Active",
    catchTime: null,
    lat: null,
    lng: null,
    sellerId: 5,
    sellerName: "Phạm Thu Hương",
    sellerPhone: "0965432109",
    emoji: "🦑",
    desc: "Mực một nắng Phú Quốc, thơm đặc trưng. Hàng chính gốc không tẩm phụ gia.",
    origin: "Phú Quốc",
    expiryDate: "2025-12-31",
    imgCount: 5,
  },
  {
    id: 6,
    type: "Dried",
    name: "Cá Khô Thiều Bình Thuận",
    price: 280000,
    salesType: "Retail",
    totalWeight: 50,
    remainingWeight: 50,
    status: "Active",
    catchTime: null,
    lat: null,
    lng: null,
    sellerId: 6,
    sellerName: "Võ Thị Mai",
    sellerPhone: "0978901234",
    emoji: "🐟",
    desc: "Cá thiều khô Bình Thuận, phơi tự nhiên 2 nắng. Không chất bảo quản.",
    origin: "Bình Thuận",
    expiryDate: "2026-03-15",
    imgCount: 3,
  },
  {
    id: 7,
    type: "Dried",
    name: "Tôm Khô Cà Mau",
    price: 420000,
    salesType: "Retail",
    totalWeight: 30,
    remainingWeight: 20,
    status: "Active",
    catchTime: null,
    lat: null,
    lng: null,
    sellerId: 7,
    sellerName: "Nguyễn Văn An",
    sellerPhone: "0901234567",
    emoji: "🍤",
    desc: "Tôm khô Cà Mau size lớn, màu đỏ đẹp, không tẩm hóa chất. Bảo đảm ngon.",
    origin: "Cà Mau",
    expiryDate: "2025-09-30",
    imgCount: 4,
  },
  {
    id: 8,
    type: "Dried",
    name: "Cá Cơm Rim Nước Mắm",
    price: 180000,
    salesType: "Retail",
    totalWeight: 20,
    remainingWeight: 18,
    status: "Active",
    catchTime: null,
    lat: null,
    lng: null,
    sellerId: 8,
    sellerName: "Trần Văn Dũng",
    sellerPhone: "0923456789",
    emoji: "🐟",
    desc: "Cá cơm rim nước mắm nhà làm, vị ngọt tự nhiên.",
    origin: "Nha Trang",
    expiryDate: "2025-08-20",
    imgCount: 2,
  },
];
const DEMO_USER = {
  id: 1,
  name: "Demo User",
  phone: "0900000001",
  role: "User",
};
const ADMIN_USER = {
  id: 99,
  name: "Admin",
  phone: "0000000000",
  role: "Admin",
};
const INIT_MSGS = [
  {
    id: 1,
    senderId: 2,
    content: "Bác ơi cá thu còn không?",
    time: "14:30",
    isMine: false,
  },
  {
    id: 2,
    senderId: 1,
    content: "Còn bác ơi, còn khoảng 38kg",
    time: "14:31",
    isMine: true,
  },
  {
    id: 3,
    senderId: 2,
    content: "Mua 5kg giá bao nhiêu?",
    time: "14:32",
    isMine: false,
  },
];
const MOCK_USERS_ADMIN = [
  { id: 1, name: "Demo User", phone: "0900000001", posts: 2, active: true },
  {
    id: 2,
    name: "Nguyễn Văn Bình",
    phone: "0912345678",
    posts: 2,
    active: true,
  },
  { id: 3, name: "Trần Thị Lan", phone: "0987654321", posts: 1, active: true },
  { id: 4, name: "Lê Minh Tuấn", phone: "0934567890", posts: 1, active: false },
  {
    id: 5,
    name: "Phạm Thu Hương",
    phone: "0965432109",
    posts: 1,
    active: true,
  },
];

/* ───────────────── SMALL COMPONENTS ───────────────── */
const pill = (bg, color, text) => (
  <span
    style={{
      background: bg,
      color,
      fontSize: 11,
      fontWeight: 700,
      padding: "2px 8px",
      borderRadius: 4,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </span>
);

function CountdownBadge({ catchTime }) {
  const rem = useCountdown(catchTime);
  const urgent =
    rem.startsWith("0h") || rem.startsWith("1h") || rem.startsWith("2h");
  return (
    <span
      style={{
        background: urgent ? "#FEE2E2" : C.warnL,
        color: urgent ? "#991B1B" : "#92400E",
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 4,
      }}
    >
      ⏰ {rem}
    </span>
  );
}

/* ───────────────── EDIT PRODUCT MODAL ───────────────── */
function EditProductModal({ product, onSave, onClose }) {
  const [form, setForm] = useState({
    name: product.name,
    price: String(product.price),
    totalWeight: String(product.totalWeight),
    remainingWeight: String(product.remainingWeight),
    desc: product.desc || "",
    salesType: product.salesType,
    origin: product.origin || "",
    expiryDate: product.expiryDate || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const inp = {
    width: "100%",
    padding: "10px 13px",
    border: `1.5px solid ${C.border}`,
    borderRadius: 9,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    background: C.white,
  };

  const handleSave = () => {
    if (!form.name.trim())
      return toast.error("Tên sản phẩm không được để trống");
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      return toast.error("Giá phải là số dương");
    if (
      !form.totalWeight ||
      isNaN(Number(form.totalWeight)) ||
      Number(form.totalWeight) <= 0
    )
      return toast.error("Tổng khối lượng phải là số dương");
    const rw = Number(form.remainingWeight);
    const tw = Number(form.totalWeight);
    if (isNaN(rw) || rw < 0)
      return toast.error("Khối lượng còn lại không hợp lệ");
    if (rw > tw)
      return toast.error(
        "Khối lượng còn lại không thể lớn hơn tổng khối lượng",
      );

    setSaving(true);
    setTimeout(() => {
      onSave({
        ...product,
        name: form.name.trim(),
        price: Number(form.price),
        totalWeight: tw,
        remainingWeight: rw,
        desc: form.desc,
        salesType: form.salesType,
        origin: form.origin,
        expiryDate: form.expiryDate,
      });
      toast.success("Đã cập nhật bài đăng thành công!");
      setSaving(false);
      onClose();
    }, 600);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          background: C.white,
          borderRadius: 16,
          width: "100%",
          maxWidth: 540,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: C.ocean,
            borderRadius: "16px 16px 0 0",
            padding: "18px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>
              ✏️ Sửa bài đăng
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {product.emoji} {product.name}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: 6,
              }}
            >
              Tên sản phẩm *
            </label>
            <input
              value={form.name}
              onChange={set("name")}
              style={inp}
              placeholder="VD: Cá Thu Tươi..."
            />
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Giá (VNĐ/kg) *
              </label>
              <input
                value={form.price}
                onChange={set("price")}
                type="number"
                style={inp}
                placeholder="180000"
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Hình thức bán
              </label>
              <select
                value={form.salesType}
                onChange={set("salesType")}
                style={{ ...inp }}
              >
                <option value="Retail">Bán lẻ (theo kg)</option>
                <option value="Wholesale">Bán buôn (nguyên rổ)</option>
              </select>
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Tổng KL (kg) *
              </label>
              <input
                value={form.totalWeight}
                onChange={set("totalWeight")}
                type="number"
                style={inp}
                placeholder="50"
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Còn lại (kg) *
              </label>
              <input
                value={form.remainingWeight}
                onChange={set("remainingWeight")}
                type="number"
                style={{ ...inp, borderColor: C.oceanL }}
                placeholder="38"
              />
            </div>
          </div>

          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: 6,
              }}
            >
              Mô tả
            </label>
            <textarea
              value={form.desc}
              onChange={set("desc")}
              style={{ ...inp, height: 80, resize: "vertical" }}
              placeholder="Mô tả sản phẩm..."
            />
          </div>

          {product.type === "Dried" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Xuất xứ
                </label>
                <input
                  value={form.origin}
                  onChange={set("origin")}
                  style={inp}
                  placeholder="Phú Quốc..."
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Hạn sử dụng
                </label>
                <input
                  value={form.expiryDate}
                  onChange={set("expiryDate")}
                  type="date"
                  style={inp}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "11px",
                background: C.bg,
                color: C.text,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                fontFamily: "inherit",
              }}
            >
              Huỷ
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 2,
                padding: "11px",
                background: saving ? C.muted : C.ocean,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 14,
                fontFamily: "inherit",
                transition: "background 0.2s",
              }}
            >
              {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── IMAGE SLIDER ───────────────── */
function ImageSlider({ product }) {
  const [idx, setIdx] = useState(0);
  const bgs = ["#0B4F6C", "#1A7FA0", "#0097A7", "#2D7D46", "#8B5E3C"];
  const n = product.imgCount;
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${bgs[idx % bgs.length]}, ${bgs[(idx + 1) % bgs.length]})`,
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 96 }}>{product.emoji}</span>
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
          Ảnh {idx + 1}/{n}
        </span>
      </div>
      {n > 1 && (
        <>
          <button
            onClick={() => setIdx((idx - 1 + n) % n)}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ‹
          </button>
          <button
            onClick={() => setIdx((idx + 1) % n)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ›
          </button>
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 6,
            }}
          >
            {Array.from({ length: n }).map((_, i) => (
              <div
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: i === idx ? "#fff" : "rgba(255,255,255,0.45)",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </>
      )}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "rgba(0,0,0,0.55)",
          color: "#fff",
          fontSize: 11,
          padding: "3px 8px",
          borderRadius: 4,
        }}
      >
        📸 {n}
      </div>
    </div>
  );
}

/* ───────────────── MAP MINI ───────────────── */
function MapMini({ lat, lng }) {
  const url = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <div
      style={{
        borderRadius: 10,
        overflow: "hidden",
        border: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          background: C.oceanP,
          padding: "10px 14px",
          fontSize: 13,
          fontWeight: 700,
          color: C.ocean,
        }}
      >
        📍 Vị trí tàu cập bến
      </div>
      <iframe
        src={url}
        width="100%"
        height="220"
        style={{ border: "none", display: "block" }}
        title="Vị trí sản phẩm"
      />
    </div>
  );
}

/* ───────────────── CHAT BOX ───────────────── */
function ChatBox({ product, onClose, user }) {
  const [msgs, setMsgs] = useState(product.id === 1 ? [...INIT_MSGS] : []);
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  const send = () => {
    if (!input.trim()) return;
    const t = new Date().toLocaleTimeString("vi", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMsgs((prev) => [
      ...prev,
      {
        id: Date.now(),
        senderId: user.id,
        content: input,
        time: t,
        isMine: true,
      },
    ]);
    setInput("");
    setTimeout(() => {
      setMsgs((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          content: "Cảm ơn bạn! Mình sẽ liên hệ lại ngay 😊",
          time: new Date().toLocaleTimeString("vi", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isMine: false,
        },
      ]);
    }, 1200);
  };
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);
  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: C.ocean,
          color: "#fff",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            💬 {product.sellerName}
          </div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>về: {product.name}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: 22,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>
      <div
        style={{
          height: 200,
          overflowY: "auto",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: "#F8FAFC",
        }}
      >
        {msgs.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: C.muted,
              fontSize: 13,
              marginTop: 60,
            }}
          >
            Hãy bắt đầu cuộc trò chuyện 👋
          </div>
        )}
        {msgs.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              justifyContent: m.isMine ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                background: m.isMine ? C.ocean : C.white,
                color: m.isMine ? "#fff" : C.text,
                padding: "8px 12px",
                borderRadius: m.isMine
                  ? "12px 12px 4px 12px"
                  : "12px 12px 12px 4px",
                fontSize: 13,
                border: m.isMine ? "none" : `1px solid ${C.border}`,
              }}
            >
              {m.content}
              <div
                style={{
                  fontSize: 10,
                  opacity: 0.6,
                  marginTop: 3,
                  textAlign: m.isMine ? "right" : "left",
                }}
              >
                {m.time}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div
        style={{
          padding: "10px 12px",
          display: "flex",
          gap: 8,
          borderTop: `1px solid ${C.border}`,
          background: C.white,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Nhập tin nhắn..."
          style={{
            flex: 1,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 13,
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={send}
          style={{
            background: C.ocean,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 14px",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
            fontFamily: "inherit",
          }}
        >
          Gửi ▶
        </button>
      </div>
    </div>
  );
}

/* ───────────────── PRODUCT CARD ───────────────── */
function ProductCard({ product, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onClick(product)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.white,
        borderRadius: 12,
        border: `1px solid ${hov ? C.oceanL : C.border}`,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? "0 8px 24px rgba(11,79,108,0.15)" : "none",
      }}
    >
      <div
        style={{
          background:
            product.type === "Fresh"
              ? "linear-gradient(135deg,#0B4F6C,#1A7FA0)"
              : "linear-gradient(135deg,#8B5E3C,#C4894F)",
          height: 150,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <span style={{ fontSize: 56 }}>{product.emoji}</span>
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          {product.type === "Fresh"
            ? pill("#FDE8E0", "#C0401A", "🌊 Tươi")
            : pill("#FEF5E4", "#8A5C00", "🔥 Khô")}
        </div>
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            fontSize: 10,
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          📸{product.imgCount}
        </div>
        {product.type === "Fresh" && (
          <div style={{ position: "absolute", bottom: 10, right: 10 }}>
            <CountdownBadge catchTime={product.catchTime} />
          </div>
        )}
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: C.dark,
            marginBottom: 6,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {product.name}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ color: C.coral, fontWeight: 800, fontSize: 16 }}>
            {fmt(product.price)}
            <span style={{ color: C.muted, fontWeight: 400, fontSize: 11 }}>
              /kg
            </span>
          </span>
          {product.salesType === "Retail"
            ? pill("#E6F4FF", "#005FCC", "Bán lẻ")
            : pill("#F3E8FF", "#6B21A8", "Bán buôn")}
        </div>
        <div
          style={{
            fontSize: 12,
            color: C.muted,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>📦 Còn {product.remainingWeight}kg</span>
          {product.type === "Fresh" ? (
            <span>📍 Gần bạn</span>
          ) : (
            <span>🏷️ {product.origin}</span>
          )}
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: C.muted }}>
          👤 {product.sellerName}
        </div>
      </div>
    </div>
  );
}

/* ───────────────── NAVBAR ───────────────── */
function Navbar({ page, setPage, user, setUser, unread }) {
  return (
    <nav
      style={{
        background: C.ocean,
        color: "#fff",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        height: 58,
        gap: 8,
        position: "sticky",
        top: 0,
        zIndex: 99,
        boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
      }}
    >
      <div
        onClick={() => setPage("home")}
        style={{
          fontWeight: 800,
          fontSize: 19,
          cursor: "pointer",
          marginRight: 24,
          whiteSpace: "nowrap",
        }}
      >
        🐟 HảiSản.vn
      </div>
      <div style={{ display: "flex", gap: 2, flex: 1 }}>
        {[
          ["home", "🏠 Trang chủ"],
          ...(user ? [["dashboard", "📊 Dashboard"]] : []),
          ...(user?.role === "Admin" ? [["admin", "⚙️ Admin"]] : []),
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setPage(k)}
            style={{
              background: page === k ? "rgba(255,255,255,0.2)" : "transparent",
              color: "#fff",
              border: "none",
              padding: "8px 14px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: page === k ? 700 : 400,
              fontFamily: "inherit",
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {user && (
          <button
            onClick={() => setPage("post")}
            style={{
              background: C.coral,
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
            }}
          >
            ＋ Đăng bài
          </button>
        )}
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {unread > 0 && (
              <div
                style={{
                  background: "#EF4444",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {unread}
              </div>
            )}
            <span style={{ fontSize: 13, opacity: 0.9 }}>
              👤 {user.name.split(" ").pop()}
            </span>
            <button
              onClick={() => setUser(null)}
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                border: "none",
                padding: "6px 12px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "inherit",
              }}
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <button
            onClick={() => setPage("auth")}
            style={{
              background: "#fff",
              color: C.ocean,
              border: "none",
              padding: "8px 16px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
            }}
          >
            Đăng nhập
          </button>
        )}
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════
   PAGE: HOME
═══════════════════════════════════════════ */
function HomePage({ setPage, setSelectedProduct, user }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("fresh");
  const [gps, setGps] = useState("idle");

  const q = search.toLowerCase();
  const fresh = PRODUCTS_INIT.filter(
    (p) => p.type === "Fresh" && p.name.toLowerCase().includes(q),
  );
  const dried = PRODUCTS_INIT.filter(
    (p) => p.type === "Dried" && p.name.toLowerCase().includes(q),
  );
  const shown = tab === "fresh" ? fresh : dried;

  const handleGps = () => {
    setGps("loading");
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        () => setGps("ok"),
        () => setGps("denied"),
      );
    else setGps("denied");
  };

  return (
    <div
      style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 80px" }}
    >
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg,#0B4F6C 0%,#1A7FA0 100%)",
          borderRadius: 16,
          padding: "32px 36px",
          marginBottom: 24,
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 40,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 120,
            opacity: 0.12,
            pointerEvents: "none",
          }}
        >
          🌊
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px" }}>
          Chợ Hải Sản Online 🐟
        </h1>
        <p
          style={{
            opacity: 0.85,
            margin: "0 0 20px",
            maxWidth: 480,
            fontSize: 14,
          }}
        >
          Mua bán hải sản tươi & khô trực tiếp từ ngư dân. Tươi trong 20km — Khô
          giao toàn quốc.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleGps}
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)",
              padding: "10px 18px",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            {gps === "ok"
              ? "✅ GPS đã bật"
              : gps === "loading"
                ? "📡 Đang lấy vị trí..."
                : "📍 Bật GPS xem hải sản tươi gần bạn"}
          </button>
          {!user && (
            <button
              onClick={() => setPage("auth")}
              style={{
                background: C.coral,
                color: "#fff",
                border: "none",
                padding: "10px 18px",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
              }}
            >
              + Đăng bán ngay
            </button>
          )}
        </div>
      </div>

      <div style={{ position: "relative", marginBottom: 16 }}>
        <span
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 16,
          }}
        >
          🔍
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm cá thu, tôm hùm, mực khô..."
          style={{
            width: "100%",
            padding: "12px 14px 12px 44px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 10,
            fontSize: 14,
            outline: "none",
            background: C.white,
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
          marginBottom: 16,
        }}
      >
        <button
          onClick={() => setTab("fresh")}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 14,
            background: tab === "fresh" ? "#FDE8E0" : "transparent",
            color: tab === "fresh" ? C.coral : C.muted,
            fontFamily: "inherit",
          }}
        >
          🌊 Hải sản tươi ({fresh.length})
        </button>
        <button
          onClick={() => setTab("dried")}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 14,
            background: tab === "dried" ? "#FEF5E4" : "transparent",
            color: tab === "dried" ? "#8A5C00" : C.muted,
            fontFamily: "inherit",
          }}
        >
          🔥 Hải sản khô ({dried.length})
        </button>
      </div>

      {tab === "fresh" && (
        <div
          style={{
            background: C.oceanP,
            border: `1px solid ${C.oceanL}`,
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: C.ocean,
          }}
        >
          ℹ️ Chỉ hiển thị bài trong vòng <strong>20km</strong>. Bài tự động ẩn
          sau <strong>24 giờ</strong>.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))",
          gap: 16,
        }}
      >
        {shown.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onClick={(prod) => {
              setSelectedProduct(prod);
              setPage("detail");
            }}
          />
        ))}
        {shown.length === 0 && (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: 60,
              color: C.muted,
            }}
          >
            <div style={{ fontSize: 52 }}>🔍</div>
            <div style={{ marginTop: 12, fontSize: 16, fontWeight: 600 }}>
              Không tìm thấy kết quả
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE: PRODUCT DETAIL
═══════════════════════════════════════════ */
function ProductDetailPage({ product, setPage, user }) {
  const [showChat, setShowChat] = useState(false);
  if (!product) {
    setPage("home");
    return null;
  }
  const pct = Math.round((product.remainingWeight / product.totalWeight) * 100);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 20px 80px" }}>
      <button
        onClick={() => setPage("home")}
        style={{
          background: "none",
          border: "none",
          color: C.ocean,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 14,
          marginBottom: 16,
          padding: 0,
          fontFamily: "inherit",
        }}
      >
        ← Quay lại
      </button>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}
      >
        <div>
          <ImageSlider product={product} />
          <div
            style={{
              background: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: 20,
              marginTop: 16,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 10,
                color: C.dark,
              }}
            >
              📝 Mô tả sản phẩm
            </div>
            <p
              style={{
                fontSize: 14,
                color: C.text,
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              {product.desc}
            </p>
            {product.origin && (
              <div style={{ marginTop: 10, fontSize: 13, color: C.muted }}>
                🏷️ Xuất xứ:{" "}
                <strong style={{ color: C.text }}>{product.origin}</strong>
              </div>
            )}
            {product.expiryDate && (
              <div style={{ marginTop: 4, fontSize: 13, color: C.muted }}>
                📅 Hạn sử dụng:{" "}
                <strong style={{ color: C.text }}>{product.expiryDate}</strong>
              </div>
            )}
          </div>
          {product.type === "Fresh" && product.lat && (
            <div style={{ marginTop: 16 }}>
              <MapMini lat={product.lat} lng={product.lng} />
            </div>
          )}
          {showChat && user && (
            <div style={{ marginTop: 16 }}>
              <ChatBox
                product={product}
                onClose={() => setShowChat(false)}
                user={user}
              />
            </div>
          )}
        </div>

        <div>
          <div
            style={{
              background: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 6,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              {product.type === "Fresh"
                ? pill("#FDE8E0", "#C0401A", "🌊 Hải sản tươi")
                : pill("#FEF5E4", "#8A5C00", "🔥 Hải sản khô")}
              {product.salesType === "Retail"
                ? pill("#E6F4FF", "#005FCC", "Bán lẻ (theo kg)")
                : pill("#F3E8FF", "#6B21A8", "Bán nguyên rổ")}
            </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: C.dark,
                margin: "0 0 10px",
              }}
            >
              {product.name}
            </h1>
            {product.type === "Fresh" && (
              <div style={{ marginBottom: 12 }}>
                <CountdownBadge catchTime={product.catchTime} />
              </div>
            )}
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: C.coral,
                marginBottom: 4,
              }}
            >
              {fmt(product.price)}
              <span style={{ fontSize: 14, fontWeight: 400, color: C.muted }}>
                /kg
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                background: C.bg,
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}
            >
              {[
                ["Tổng KL", `${product.totalWeight}kg`],
                ["Còn lại", `${product.remainingWeight}kg`],
              ].map(([l, v]) => (
                <div key={l}>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {l}
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      color: l === "Còn lại" ? C.ok : C.dark,
                      marginTop: 2,
                    }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                background: "#E8E8E8",
                borderRadius: 4,
                height: 6,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  background: pct > 50 ? C.ok : pct > 20 ? C.warn : C.coral,
                  borderRadius: 4,
                  height: 6,
                  width: `${pct}%`,
                  transition: "width 0.4s",
                }}
              />
            </div>

            <div
              style={{
                background: C.oceanP,
                borderRadius: 8,
                padding: "12px 14px",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Người bán
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.ocean }}>
                👤 {product.sellerName}
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>
                📞 {product.sellerPhone}
              </div>
            </div>

            {user ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <a
                  href={`tel:${product.sellerPhone}`}
                  style={{
                    background: C.ok,
                    color: "#fff",
                    padding: 13,
                    borderRadius: 10,
                    textAlign: "center",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: 15,
                    display: "block",
                  }}
                >
                  📞 Gọi: {product.sellerPhone}
                </a>
                <button
                  onClick={() => setShowChat(!showChat)}
                  style={{
                    background: showChat ? C.muted : C.ocean,
                    color: "#fff",
                    border: "none",
                    padding: 13,
                    borderRadius: 10,
                    cursor: "pointer",
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "inherit",
                  }}
                >
                  {showChat ? "✕ Đóng chat" : "💬 Chat ngay"}
                </button>
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: 16,
                  background: C.bg,
                  borderRadius: 8,
                  fontSize: 14,
                  color: C.muted,
                }}
              >
                🔒{" "}
                <span
                  style={{ cursor: "pointer", color: C.ocean, fontWeight: 600 }}
                >
                  Đăng nhập
                </span>{" "}
                để liên hệ người bán
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE: AUTH
═══════════════════════════════════════════ */
function AuthPage({ setUser, setPage }) {
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const inp = {
    width: "100%",
    padding: "11px 14px",
    border: `1.5px solid ${C.border}`,
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const submit = (e) => {
    e.preventDefault();
    setErr("");
    if (!phone || !pw) return setErr("Vui lòng điền đầy đủ thông tin");
    if (!/^0\d{9}$/.test(phone))
      return setErr("Số điện thoại phải là 10 số, bắt đầu bằng 0");
    if (phone === "0000000000" && pw === "admin123") {
      setUser(ADMIN_USER);
      setPage("admin");
    } else {
      setUser({
        ...DEMO_USER,
        name: mode === "register" ? name : "Demo User",
        phone,
      });
      setPage("home");
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 58px)",
        background: "linear-gradient(135deg,#0B4F6C,#1A7FA0)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: C.white,
          borderRadius: 16,
          padding: "40px 36px",
          width: "100%",
          maxWidth: 400,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48 }}>🐟</div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: C.dark,
              margin: "8px 0 0",
            }}
          >
            HảiSản.vn
          </h1>
          <div
            style={{
              display: "flex",
              gap: 4,
              background: C.bg,
              borderRadius: 10,
              padding: 4,
              marginTop: 20,
            }}
          >
            {[
              ["login", "Đăng nhập"],
              ["register", "Đăng ký"],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setMode(k)}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                  background: mode === k ? C.ocean : "transparent",
                  color: mode === k ? "#fff" : C.muted,
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          {mode === "register" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Họ và tên"
              style={inp}
            />
          )}
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Số điện thoại (VD: 0912345678)"
            style={inp}
            type="tel"
          />
          <input
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Mật khẩu"
            style={inp}
            type="password"
          />
          {err && (
            <div
              style={{
                color: C.coral,
                fontSize: 13,
                background: C.coralL,
                padding: "8px 12px",
                borderRadius: 8,
              }}
            >
              {err}
            </div>
          )}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: 13,
              background: C.ocean,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "inherit",
            }}
          >
            → {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </button>
        </form>
        <div
          style={{
            background: C.warnL,
            borderRadius: 8,
            padding: "12px 14px",
            fontSize: 12,
            color: "#92400E",
            marginTop: 16,
            lineHeight: 1.65,
          }}
        >
          <strong>Demo:</strong> SĐT 10 số bất kỳ + mật khẩu bất kỳ.
          <br />
          <strong>Admin:</strong> 0000000000 / admin123
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE: POST LISTING
═══════════════════════════════════════════ */
function PostListingPage({ user, setPage }) {
  const [type, setType] = useState("Fresh");
  const [salesType, setSalesType] = useState("Retail");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [desc, setDesc] = useState("");
  const [origin, setOrigin] = useState("");
  const [expiry, setExpiry] = useState("");
  const [gps, setGps] = useState("idle");
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const inp = {
    width: "100%",
    padding: "11px 14px",
    border: `1.5px solid ${C.border}`,
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };
  const getGps = () => {
    setGps("loading");
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        () => setGps("ok"),
        () => setGps("denied"),
      );
    else setGps("denied");
  };

  const submit = () => {
    if (!name.trim()) return toast.error("Vui lòng nhập tên sản phẩm");
    if (!price || Number(price) <= 0)
      return toast.error("Vui lòng nhập giá hợp lệ");
    if (!weight || Number(weight) <= 0)
      return toast.error("Vui lòng nhập khối lượng hợp lệ");
    if (type === "Fresh" && gps !== "ok")
      return toast.warn("Bắt buộc bật GPS để đăng hải sản tươi");
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
    }, 800);
  };

  if (done)
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "60px auto",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: C.okL,
            border: `2px solid ${C.ok}`,
            borderRadius: 16,
            padding: "48px 32px",
          }}
        >
          <div style={{ fontSize: 72 }}>✅</div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: C.ok,
              margin: "16px 0 8px",
            }}
          >
            Đăng bài thành công!
          </h2>
          <p style={{ color: C.muted }}>Bài đăng của bạn đã lên trang chủ.</p>
          <button
            onClick={() => setPage("home")}
            style={{
              marginTop: 20,
              background: C.ocean,
              color: "#fff",
              border: "none",
              padding: "12px 28px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 15,
              fontFamily: "inherit",
            }}
          >
            ← Về trang chủ
          </button>
        </div>
      </div>
    );

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px 80px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <button
          onClick={() => setPage("home")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.ocean,
            fontSize: 22,
            padding: 0,
            fontFamily: "inherit",
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: 0 }}>
          📝 Đăng bài bán hải sản
        </h1>
      </div>

      <section
        style={{
          background: C.white,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          padding: 20,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 12,
            color: C.dark,
          }}
        >
          Loại hải sản *
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          {[
            [
              "Fresh",
              "🌊 Hải sản TƯƠI",
              "Cần GPS · Hết hạn sau 24h · Chỉ 20km",
              C.coral,
              "#FDE8E0",
            ],
            [
              "Dried",
              "🔥 Hải sản KHÔ",
              "Không cần GPS · Giao toàn quốc",
              C.warn,
              "#FEF5E4",
            ],
          ].map(([k, l, sub, ac, bg]) => (
            <button
              key={k}
              onClick={() => setType(k)}
              style={{
                padding: "16px",
                border: `2px solid ${type === k ? ac : C.border}`,
                borderRadius: 10,
                cursor: "pointer",
                background: type === k ? bg : "transparent",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>
                {l}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                {sub}
              </div>
            </button>
          ))}
        </div>
      </section>

      {type === "Fresh" && (
        <div
          style={{
            background: gps === "ok" ? C.okL : C.warnL,
            border: `1px solid ${gps === "ok" ? C.ok : C.warn}`,
            borderRadius: 10,
            padding: "13px 16px",
            marginBottom: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: gps === "ok" ? C.ok : "#92400E",
            }}
          >
            {gps === "ok"
              ? "✅ Đã lấy vị trí GPS"
              : "⚠️ Bắt buộc bật GPS khi đăng hải sản tươi"}
          </span>
          {gps !== "ok" && (
            <button
              onClick={getGps}
              style={{
                background: C.warn,
                color: "#fff",
                border: "none",
                padding: "7px 14px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
              }}
            >
              {gps === "loading" ? "Đang lấy..." : "📍 Bật GPS"}
            </button>
          )}
        </div>
      )}

      <section
        style={{
          background: C.white,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          padding: 20,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 14,
            color: C.dark,
          }}
        >
          Thông tin sản phẩm
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên hải sản (VD: Cá Thu, Mực Ống Khô...)"
            style={inp}
          />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Giá (VNĐ/kg)"
              style={inp}
              type="number"
            />
            <input
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Khối lượng (kg)"
              style={inp}
              type="number"
            />
          </div>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Mô tả thêm (tuỳ chọn)..."
            style={{ ...inp, height: 80, resize: "vertical" }}
          />
          <div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>
              Hình thức bán:
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                ["Retail", "Bán lẻ (theo kg)"],
                ["Wholesale", "Bán buôn (nguyên rổ)"],
              ].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setSalesType(k)}
                  style={{
                    padding: "8px 16px",
                    border: `1.5px solid ${salesType === k ? C.ocean : C.border}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    background: salesType === k ? C.oceanP : "transparent",
                    fontWeight: 600,
                    fontSize: 13,
                    color: salesType === k ? C.ocean : C.text,
                    fontFamily: "inherit",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          {type === "Dried" && (
            <>
              <input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Xuất xứ (VD: Phú Quốc, Bình Thuận...)"
                style={inp}
              />
              <input
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="Hạn sử dụng"
                style={inp}
                type="date"
              />
            </>
          )}
        </div>
      </section>

      <section
        style={{
          background: C.white,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>
          📸 Hình ảnh
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
          Tối đa 5 ảnh. Ảnh đầu tiên là ảnh bìa (thumbnail).
        </div>
        <label
          style={{
            display: "block",
            border: `2px dashed ${C.border}`,
            borderRadius: 10,
            padding: "24px",
            textAlign: "center",
            cursor: "pointer",
            color: C.muted,
            background: C.bg,
          }}
        >
          <div style={{ fontSize: 32 }}>📷</div>
          <div style={{ marginTop: 8, fontSize: 14 }}>Chọn ảnh PNG, JPG</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>hoặc kéo thả vào đây</div>
          <input
            type="file"
            multiple
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => setImages(Array.from(e.target.files).slice(0, 5))}
          />
        </label>
        {images.length > 0 && (
          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              color: C.ok,
              fontWeight: 600,
            }}
          >
            ✅ Đã chọn {images.length} ảnh
          </div>
        )}
      </section>

      <button
        onClick={submit}
        disabled={submitting}
        style={{
          width: "100%",
          padding: 14,
          background: submitting ? C.muted : C.ocean,
          color: "#fff",
          border: "none",
          borderRadius: 12,
          cursor: submitting ? "not-allowed" : "pointer",
          fontSize: 16,
          fontWeight: 700,
          fontFamily: "inherit",
          transition: "background 0.2s",
        }}
      >
        {submitting ? "Đang đăng..." : "🚀 Đăng bài"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE: DASHBOARD  (tab Tài khoản + edit đầy đủ)
═══════════════════════════════════════════ */
function DashboardPage({ user, setUser, setPage, setSelectedProduct }) {
  const [tab, setTab] = useState("listings");
  const [products, setProducts] = useState(
    PRODUCTS_INIT.filter((p) => p.sellerId === 2),
  );
  const [editProduct, setEditProduct] = useState(null);

  // ── Account form state ──
  const [accName, setAccName] = useState(user.name);
  const [savingName, setSavingName] = useState(false);
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const chats = [
    {
      name: "Người mua A",
      product: "Cá Thu Tươi",
      lastMsg: "Mua 5kg giá bao nhiêu?",
      time: "14:32",
      unread: 2,
    },
    {
      name: "Người mua B",
      product: "Mực Ống Tươi",
      lastMsg: "Còn hàng không bác?",
      time: "13:10",
      unread: 1,
    },
    {
      name: "Người mua C",
      product: "Cá Thu Tươi",
      lastMsg: "OK bác, mình lấy nhé",
      time: "12:00",
      unread: 0,
    },
  ];

  const handleSaveName = () => {
    if (!accName.trim()) return toast.error("Tên không được để trống");
    if (accName.trim().length < 2)
      return toast.error("Tên phải ít nhất 2 ký tự");
    setSavingName(true);
    setTimeout(() => {
      setUser({ ...user, name: accName.trim() });
      toast.success("Đã cập nhật tên thành công!");
      setSavingName(false);
    }, 600);
  };

  const handleChangePw = () => {
    if (!curPw || !newPw || !confirmPw)
      return toast.error("Vui lòng điền đầy đủ các trường mật khẩu");
    if (newPw.length < 6) return toast.error("Mật khẩu mới tối thiểu 6 ký tự");
    if (newPw !== confirmPw) return toast.error("Xác nhận mật khẩu không khớp");
    if (curPw === newPw)
      return toast.error("Mật khẩu mới phải khác mật khẩu hiện tại");
    setSavingPw(true);
    setTimeout(() => {
      toast.success("Đổi mật khẩu thành công!");
      setCurPw("");
      setNewPw("");
      setConfirmPw("");
      setSavingPw(false);
    }, 700);
  };

  const handleSaveProduct = (updated) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const inp = {
    width: "100%",
    padding: "11px 14px",
    border: `1.5px solid ${C.border}`,
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const TABS = [
    ["listings", `📦 Bài đã đăng (${products.length})`],
    ["chats", "💬 Tin nhắn"],
    ["account", "👤 Tài khoản"],
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 80px" }}>
      {editProduct && (
        <EditProductModal
          product={editProduct}
          onSave={handleSaveProduct}
          onClose={() => setEditProduct(null)}
        />
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: 0 }}>
          📊 Dashboard — {user.name}
        </h1>
        <button
          onClick={() => setPage("post")}
          style={{
            background: C.coral,
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 14,
            fontFamily: "inherit",
          }}
        >
          ＋ Đăng bài mới
        </button>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          [
            "📦",
            products.filter((p) => p.status === "Active").length,
            "Bài đang bán",
            C.ok,
          ],
          ["💬", 3, "Tin nhắn chưa đọc", C.coral],
          [
            "⚖️",
            `${products.reduce((s, p) => s + p.remainingWeight, 0)}kg`,
            "Tổng hàng còn",
            C.ocean,
          ],
        ].map(([ico, val, lbl, col]) => (
          <div
            key={lbl}
            style={{
              background: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: "18px 20px",
            }}
          >
            <div style={{ fontSize: 22 }}>{ico}</div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: col,
                marginTop: 4,
              }}
            >
              {val}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {lbl}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
          marginBottom: 20,
        }}
      >
        {TABS.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              background: tab === k ? C.oceanP : "transparent",
              color: tab === k ? C.ocean : C.muted,
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ── TAB: LISTINGS ── */}
      {tab === "listings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {products.map((p) => (
            <div
              key={p.id}
              style={{
                background: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span style={{ fontSize: 36 }}>{p.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: C.dark,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: C.muted,
                    marginTop: 3,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: C.coral, fontWeight: 700 }}>
                    {fmt(p.price)}/kg
                  </span>
                  <span>
                    Còn:{" "}
                    <strong style={{ color: C.ok }}>
                      {p.remainingWeight}kg
                    </strong>{" "}
                    / {p.totalWeight}kg
                  </span>
                  {p.type === "Fresh"
                    ? pill("#FDE8E0", "#C0401A", "🌊 Tươi")
                    : pill("#FEF5E4", "#8A5C00", "🔥 Khô")}
                  {p.salesType === "Retail"
                    ? pill("#E6F4FF", "#005FCC", "Bán lẻ")
                    : pill("#F3E8FF", "#6B21A8", "Bán buôn")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => setEditProduct(p)}
                  style={{
                    background: C.oceanP,
                    color: C.ocean,
                    border: `1px solid ${C.oceanL}`,
                    padding: "7px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                  }}
                >
                  ✏️ Sửa bài
                </button>
                <button
                  onClick={() => {
                    setSelectedProduct(p);
                    setPage("detail");
                  }}
                  style={{
                    background: C.bg,
                    color: C.ocean,
                    border: `1px solid ${C.border}`,
                    padding: "7px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "inherit",
                  }}
                >
                  Xem →
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div style={{ textAlign: "center", padding: 48, color: C.muted }}>
              Bạn chưa có bài đăng nào.{" "}
              <span
                onClick={() => setPage("post")}
                style={{ color: C.ocean, cursor: "pointer", fontWeight: 700 }}
              >
                Đăng ngay →
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CHATS ── */}
      {tab === "chats" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {chats.map((chat) => (
            <div
              key={chat.name}
              style={{
                background: C.white,
                borderRadius: 12,
                border: `1px solid ${chat.unread ? C.ocean : C.border}`,
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: C.oceanP,
                  color: C.ocean,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {chat.name.slice(-1)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>
                  {chat.name}{" "}
                  <span
                    style={{ fontWeight: 400, color: C.muted, fontSize: 12 }}
                  >
                    về {chat.product}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                  {chat.lastMsg}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: C.muted }}>{chat.time}</div>
                {chat.unread > 0 && (
                  <div
                    style={{
                      background: C.coral,
                      color: "#fff",
                      borderRadius: "50%",
                      width: 20,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      marginTop: 4,
                      marginLeft: "auto",
                    }}
                  >
                    {chat.unread}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: TÀI KHOẢN ── */}
      {tab === "account" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Thông tin cơ bản */}
          <div
            style={{
              background: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: C.oceanP,
                padding: "16px 20px",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 15, color: C.ocean }}>
                👤 Thông tin cơ bản
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                Cập nhật tên hiển thị của bạn
              </div>
            </div>
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Phone (read-only) */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Số điện thoại
                </label>
                <div
                  style={{
                    ...inp,
                    background: C.bg,
                    color: C.muted,
                    border: `1.5px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  📞 {user.phone}
                  <span
                    style={{
                      fontSize: 11,
                      background: C.border,
                      borderRadius: 4,
                      padding: "1px 6px",
                      color: C.muted,
                      marginLeft: "auto",
                    }}
                  >
                    Không thể thay đổi
                  </span>
                </div>
              </div>

              {/* Name */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Tên hiển thị
                </label>
                <input
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  placeholder="Nhập tên của bạn..."
                  style={inp}
                />
              </div>

              <button
                onClick={handleSaveName}
                disabled={savingName || accName.trim() === user.name}
                style={{
                  alignSelf: "flex-start",
                  padding: "10px 22px",
                  background:
                    savingName || accName.trim() === user.name
                      ? C.border
                      : C.ocean,
                  color:
                    savingName || accName.trim() === user.name
                      ? C.muted
                      : "#fff",
                  border: "none",
                  borderRadius: 9,
                  cursor:
                    savingName || accName.trim() === user.name
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                {savingName ? "Đang lưu..." : "💾 Lưu tên"}
              </button>
            </div>
          </div>

          {/* Đổi mật khẩu */}
          <div
            style={{
              background: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "#FEF3C7",
                padding: "16px 20px",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 15, color: "#92400E" }}>
                🔐 Đổi mật khẩu
              </div>
              <div style={{ fontSize: 12, color: "#A16207", marginTop: 2 }}>
                Mật khẩu phải có ít nhất 6 ký tự
              </div>
            </div>
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Mật khẩu hiện tại
                </label>
                <input
                  value={curPw}
                  onChange={(e) => setCurPw(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  style={inp}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Mật khẩu mới
                  </label>
                  <input
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    type="password"
                    placeholder="••••••••"
                    style={inp}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    type="password"
                    placeholder="••••••••"
                    style={{
                      ...inp,
                      borderColor:
                        newPw && confirmPw && newPw !== confirmPw
                          ? C.coral
                          : C.border,
                    }}
                  />
                  {newPw && confirmPw && newPw !== confirmPw && (
                    <div style={{ fontSize: 11, color: C.coral, marginTop: 4 }}>
                      ❌ Mật khẩu không khớp
                    </div>
                  )}
                  {newPw && confirmPw && newPw === confirmPw && (
                    <div style={{ fontSize: 11, color: C.ok, marginTop: 4 }}>
                      ✅ Mật khẩu khớp
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleChangePw}
                disabled={savingPw}
                style={{
                  alignSelf: "flex-start",
                  padding: "10px 22px",
                  background: savingPw ? C.muted : C.warn,
                  color: "#fff",
                  border: "none",
                  borderRadius: 9,
                  cursor: savingPw ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                {savingPw ? "Đang lưu..." : "🔐 Đổi mật khẩu"}
              </button>
            </div>
          </div>

          {/* Nguy hiểm */}
          <div
            style={{
              background: "#FFF5F5",
              borderRadius: 12,
              border: `1px solid #FCA5A5`,
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#991B1B" }}>
                🚪 Đăng xuất
              </div>
              <div style={{ fontSize: 12, color: "#B91C1C", marginTop: 2 }}>
                Bạn sẽ cần đăng nhập lại
              </div>
            </div>
            <button
              onClick={() => {
                setUser(null);
                setPage("home");
                toast.info("Đã đăng xuất thành công");
              }}
              style={{
                background: "#FEE2E2",
                color: "#991B1B",
                border: "1px solid #FCA5A5",
                padding: "8px 18px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
                fontFamily: "inherit",
              }}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE: ADMIN
═══════════════════════════════════════════ */
function AdminPage() {
  const [tab, setTab] = useState("stats");
  const [users, setUsers] = useState(MOCK_USERS_ADMIN);
  const [listings, setListings] = useState([...PRODUCTS_INIT]);
  const total = {
    u: users.length,
    p: listings.length,
    fresh: listings.filter((p) => p.type === "Fresh").length,
    dried: listings.filter((p) => p.type === "Dried").length,
  };

  const handleDeleteListing = (id) => {
    setListings((prev) => prev.filter((x) => x.id !== id));
    toast.success("Đã xoá bài đăng");
  };

  const handleToggleUser = (uid) => {
    const u = users.find((x) => x.id === uid);
    setUsers((prev) =>
      prev.map((x) => (x.id === uid ? { ...x, active: !x.active } : x)),
    );
    toast.info(
      u.active ? `Đã khoá tài khoản ${u.name}` : `Đã mở khoá ${u.name}`,
    );
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 20px 80px" }}>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: C.dark,
          marginBottom: 20,
        }}
      >
        ⚙️ Trang Quản Trị Admin
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          [total.u, "👥", "Tổng người dùng", C.ocean],
          [total.p, "📋", "Tổng bài đăng", C.ok],
          [total.fresh, "🌊", "Hải sản tươi", C.coral],
          [total.dried, "🔥", "Hải sản khô", C.warn],
        ].map(([val, ico, lbl, col]) => (
          <div
            key={lbl}
            style={{
              background: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: "18px 20px",
            }}
          >
            <div style={{ fontSize: 22 }}>{ico}</div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: col,
                marginTop: 4,
              }}
            >
              {val}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {lbl}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
          marginBottom: 20,
        }}
      >
        {[
          ["stats", "📊 Thống kê"],
          ["users", "👥 Người dùng"],
          ["listings", "📋 Bài đăng"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              background: tab === k ? C.ocean : "transparent",
              color: tab === k ? "#fff" : C.muted,
              fontFamily: "inherit",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "stats" && (
        <div
          style={{
            background: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            padding: 24,
          }}
        >
          <div style={{ fontWeight: 700, color: C.dark, marginBottom: 16 }}>
            Phân bố bài đăng
          </div>
          {[
            ["Hải sản tươi", total.fresh, C.coral],
            ["Hải sản khô", total.dried, C.warn],
          ].map(([lbl, n, col]) => (
            <div key={lbl} style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                <span style={{ color: C.text }}>{lbl}</span>
                <span style={{ color: col }}>
                  {n} bài ({Math.round((n / total.p) * 100)}%)
                </span>
              </div>
              <div
                style={{ background: "#E8E8E8", borderRadius: 4, height: 8 }}
              >
                <div
                  style={{
                    background: col,
                    borderRadius: 4,
                    height: 8,
                    width: `${(n / total.p) * 100}%`,
                    transition: "width 0.5s",
                  }}
                />
              </div>
            </div>
          ))}
          <div
            style={{
              marginTop: 20,
              background: C.okL,
              borderRadius: 10,
              padding: "14px 16px",
              fontSize: 13,
              color: C.ok,
              fontWeight: 600,
            }}
          >
            ✅ Hệ thống hoạt động bình thường. Cronjob chạy mỗi giờ, tự động ẩn
            bài tươi quá 24h.
          </div>
        </div>
      )}

      {tab === "users" && (
        <div
          style={{
            background: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {[
                  "ID",
                  "Tên",
                  "Số điện thoại",
                  "Bài đăng",
                  "Trạng thái",
                  "Thao tác",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: C.muted,
                      fontSize: 13,
                    }}
                  >
                    #{u.id}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {u.name}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      color: C.muted,
                    }}
                  >
                    {u.phone}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    {u.posts}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {u.active
                      ? pill(C.okL, C.ok, "● Hoạt động")
                      : pill("#FEE2E2", "#991B1B", "● Bị khoá")}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => handleToggleUser(u.id)}
                      style={{
                        background: u.active ? "#FEE2E2" : C.okL,
                        color: u.active ? "#991B1B" : C.ok,
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "inherit",
                      }}
                    >
                      {u.active ? "🔒 Khoá" : "🔓 Mở khoá"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "listings" && (
        <div
          style={{
            background: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {[
                  "Sản phẩm",
                  "Loại",
                  "Người bán",
                  "Giá/kg",
                  "Còn lại",
                  "Thao tác",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listings.map((p) => (
                <tr key={p.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {p.emoji} {p.name}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {p.type === "Fresh"
                      ? pill("#FDE8E0", "#C0401A", "Tươi")
                      : pill("#FEF5E4", "#8A5C00", "Khô")}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      color: C.muted,
                    }}
                  >
                    {p.sellerName}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      color: C.coral,
                    }}
                  >
                    {fmt(p.price)}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    {p.remainingWeight}kg
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => handleDeleteListing(p.id)}
                      style={{
                        background: "#FEE2E2",
                        color: "#991B1B",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "inherit",
                      }}
                    >
                      🗑️ Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════ */
export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const safePage = (p) => {
    if ((p === "post" || p === "dashboard") && !user) {
      setPage("auth");
      return;
    }
    if (p === "admin" && user?.role !== "Admin") {
      setPage("auth");
      return;
    }
    setPage(p);
  };

  const handleSetUser = (u) => {
    setUser(u);
    if (!u) setPage("home");
  };

  return (
    <div
      style={{
        fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
        background: C.bg,
        minHeight: "100vh",
      }}
    >
      <Navbar
        page={page}
        setPage={safePage}
        user={user}
        setUser={handleSetUser}
        unread={user ? 3 : 0}
      />
      {page === "home" && (
        <HomePage
          setPage={safePage}
          setSelectedProduct={setProduct}
          user={user}
        />
      )}
      {page === "detail" && (
        <ProductDetailPage product={product} setPage={safePage} user={user} />
      )}
      {page === "auth" && <AuthPage setUser={setUser} setPage={setPage} />}
      {page === "post" && <PostListingPage user={user} setPage={safePage} />}
      {page === "dashboard" && (
        <DashboardPage
          user={user}
          setUser={handleSetUser}
          setPage={safePage}
          setSelectedProduct={setProduct}
        />
      )}
      {page === "admin" && <AdminPage />}
      <ToastContainer />
    </div>
  );
}
