import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../utils/theme";
import { api } from "../services/api";

const CATEGORIES = [
  { id: "Fish", label: "🐟 Cá các loại" },
  { id: "Shrimp", label: "🦐 Tôm sống" },
  { id: "Squid", label: "🦑 Mực, Bạch tuộc" },
  { id: "Crab", label: "🦀 Cua, Ghẹ" },
  { id: "Shellfish", label: "🐚 Sò, Nghêu, Ốc" },
  { id: "Others", label: "✨ Phân loại khác" },
];

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
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
          0.75
        );
      };
    };
  });
};

export function PostListingPage({ user }) {
  const navigate = useNavigate();
  const [type, setType] = useState("Fresh");
  const [postCount, setPostCount] = useState({ count: 0, max: 10, isPremium: false, loading: true });

  React.useEffect(() => {
    api("/products/today-count")
      .then((data) => {
        setPostCount({
          count: data.count,
          max: data.max,
          isPremium: data.isPremium,
          loading: false,
        });
      })
      .catch(() => {
        setPostCount((p) => ({ ...p, loading: false }));
      });
  }, []);
  const [category, setCategory] = useState("Fish"); // Giá trị phân loại mặc định
  const [salesType, setSalesType] = useState("Retail");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [desc, setDesc] = useState("");
  const [origin, setOrigin] = useState("");
  const [expiry, setExpiry] = useState("");
  const [catchTime, setCatchTime] = useState("");
  const [gps, setGps] = useState({ status: "idle", lat: null, lng: null });
  const [address, setAddress] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const [focusedField, setFocusedField] = useState(null);
  const [hoveredType, setHoveredType] = useState(null);


  const getInputStyle = (fieldName) => ({
    width: "100%",
    padding: "12px 14px",
    border: `1.5px solid ${focusedField === fieldName ? C.ocean : C.border}`,
    borderRadius: 12,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    background: "#fff",
    transition: "all 0.25s ease",
    boxShadow:
      focusedField === fieldName
        ? "0 0 0 4px rgba(11, 79, 108, 0.12), 0 2px 8px rgba(0,0,0,0.02)"
        : "0 1px 2px rgba(0,0,0,0.01)",
  });

  const getGps = () => {
    setGps((g) => ({ ...g, status: "loading" }));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setGps({ status: "ok", lat, lng });
          try {
            const r = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`,
            );
            const d = await r.json();
            const a = d.address || {};
            const parts = [
              a.quarter || a.suburb || a.neighbourhood || a.village,
              a.city_district || a.county || a.city || a.town,
            ].filter(Boolean);
            if (parts.length > 0) setAddress(parts.join(", "));
          } catch { }
        },
        () => setGps({ status: "denied", lat: null, lng: null }),
      );
    } else setGps({ status: "denied", lat: null, lng: null });
  };

  const submit = async () => {
    setErr("");
    if (!name || !price || !weight)
      return setErr("Vui lòng điền đầy đủ tên, giá và khối lượng hải sản");
    if (type === "Fresh" && gps.status !== "ok")
      return setErr("Bắt buộc phải bật định vị GPS để đăng tin hải sản tươi sống");

    setLoading(true);

    try {
      let uploadedImageUrls = [];

      // 🌟 BƯỚC A: Nếu có ảnh, thực hiện nén và tải trực tiếp lên Cloudinary
      if (images.length > 0) {
        // 1. Lấy chữ ký số bảo mật từ Backend
        const sigData = await api("/images/signature");

        // 2. Nén toàn bộ ảnh phía Client
        const compressedFiles = await Promise.all(images.map(img => compressImage(img)));

        // 3. Tải đồng thời trực tiếp lên máy chủ Cloudinary CDN
        uploadedImageUrls = await Promise.all(
          compressedFiles.map(async (file) => {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("api_key", sigData.apiKey);
            fd.append("timestamp", sigData.timestamp);
            fd.append("signature", sigData.signature);
            fd.append("folder", sigData.folder);

            // Gửi trực tiếp lên Cloudinary API
            const cloudRes = await fetch(
              `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
              {
                method: "POST",
                body: fd,
              }
            );

            if (!cloudRes.ok) {
              throw new Error("Tải ảnh trực tiếp lên máy chủ CDN thất bại.");
            }

            const cloudData = await cloudRes.json();
            return cloudData.secure_url; // Trả về đường dẫn CDN
          })
        );
      }

      // 🌟 BƯỚC B: Gửi duy nhất 1 cuộc gọi tạo bài đăng kèm danh sách ảnh đã tải thành công
      const body = {
        type,
        category,
        name,
        description: desc,
        price,
        salesType,
        totalWeight: weight,
        images: uploadedImageUrls, // Đính kèm mảng URL ảnh trực tiếp
        ...(catchTime ? { catchTime } : {}),
        ...(type === "Fresh"
          ? address
            ? { origin: address }
            : {}
          : origin
            ? { origin }
            : {}),
        ...(expiry ? { expiryDate: expiry } : {}),
        ...(gps.status === "ok" ? { lat: gps.lat, lng: gps.lng } : {}),
      };

      await api("/products", {
        method: "POST",
        body: JSON.stringify(body),
      });

      setDone(true);
    } catch (e) {
      setErr(e.message || "Đăng mẻ hàng thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (done)
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "80px auto",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: C.okL,
            border: `1.5px solid ${C.ok}50`,
            borderRadius: 24,
            padding: "56px 40px",
            boxShadow: "0 15px 35px rgba(45, 125, 70, 0.1)",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: "#EAF5EE",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              margin: "0 auto 16px",
              boxShadow: "0 4px 10px rgba(45, 125, 70, 0.15)",
            }}
          >
            ✅
          </div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: C.ok,
              margin: "16px 0 8px",
            }}
          >
            Đăng tin thành công!
          </h2>
          <p style={{ color: C.muted, fontSize: 14, fontWeight: 500 }}>
            Hải sản của bạn đã được xuất bản lên trang chủ HảiSản.vn.
          </p>
          <button
            onClick={() => navigate("/")}
            style={{
              marginTop: 24,
              background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`,
              color: "#fff",
              border: "none",
              padding: "12px 32px",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 15,
              fontFamily: "inherit",
              boxShadow: "0 4px 14px rgba(11, 79, 108, 0.25)",
            }}
          >
            ← Quay về trang chủ
          </button>
        </div>
      </div>
    );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 80px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            cursor: "pointer",
            color: C.ocean,
            fontSize: 16,
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
          onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
        >
          ⟨
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: 0 }}>
          📝 Đăng tin bán hải sản mới
        </h1>
      </div>

      {/* ⚠️ CẢNH BÁO GIỚI HẠN ĐĂNG BÀI */}
      {!postCount.loading && !postCount.isPremium && (
        <div
          style={{
            background: postCount.count >= postCount.max ? "#FEE2E2" : "#EFF6FF",
            border: `1.5px solid ${postCount.count >= postCount.max ? "#EF4444" : "#3B82F6"}`,
            borderRadius: 16,
            padding: "16px 20px",
            marginBottom: 24,
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{postCount.count >= postCount.max ? "🛑" : "💡"}</span>
            <div style={{ fontWeight: 800, fontSize: 13.5, color: postCount.count >= postCount.max ? "#991B1B" : "#1E3A8A" }}>
              {postCount.count >= postCount.max
                ? "BẠN ĐẠT GIỚI HẠN ĐĂNG TIN HÔM NAY!"
                : `HẠN MỨC ĐĂNG TIN HÔM NAY: ${postCount.count} / ${postCount.max} BÀI`}
            </div>
          </div>
          <p style={{ fontSize: 13, color: postCount.count >= postCount.max ? "#7F1D1D" : "#1E40AF", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
            {postCount.count >= postCount.max
              ? "Tài khoản thường chỉ được đăng tối đa 5 bài mỗi ngày để hạn chế spam. Bạn đã dùng hết lượt đăng hôm nay. Hãy nâng cấp Premium để đăng không giới hạn!"
              : `Bạn đang là thành viên thường, được phép đăng tối đa 5 bài viết mỗi ngày. Hãy nâng cấp lên Premium để mở khoá tính năng đăng bán không giới hạn!`}
          </p>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            style={{
              alignSelf: "flex-start",
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              color: "#fff",
              border: "none",
              padding: "8px 18px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 12,
              fontFamily: "inherit",
              boxShadow: "0 2px 8px rgba(217, 119, 6, 0.25)",
              marginTop: 4,
            }}
          >
            🌟 Nâng cấp Premium chỉ 100đ →
          </button>
        </div>
      )}

      {/* Hiển thị banner Premium đối với thành viên Premium */}
      {!postCount.loading && postCount.isPremium && (
        <div
          style={{
            background: "linear-gradient(135deg, #FFFDF5 0%, #FFF9E6 100%)",
            border: "1.5px solid #F59E0B",
            borderRadius: 16,
            padding: "16px 20px",
            marginBottom: 24,
            boxShadow: "0 4px 6px -1px rgba(245, 158, 11, 0.1)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 24 }}>👑</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13.5, color: "#92400E" }}>
              BẠN ĐANG LÀ THÀNH VIÊN PREMIUM!
            </div>
            <p style={{ fontSize: 12.5, color: "#B45309", margin: "2px 0 0 0", lineHeight: 1.4, fontWeight: 500 }}>
              Đặc quyền đăng bán tin hải sản không giới hạn số lượng bài viết mỗi ngày đã sẵn sàng hoạt động.
            </p>
          </div>
        </div>
      )}

      <section
        style={{
          background: C.white,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          padding: 24,
          marginBottom: 16,
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: 13,
            marginBottom: 14,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Loại hải sản đăng bán *
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {[
            [
              "Fresh",
              "🌊 Hải sản TƯƠI SỐNG",
              "Bắt buộc GPS • Đăng 24 giờ tự động ẩn • Bán kính 20km",
              C.coral,
              "#FDE8E0",
            ],
            [
              "Dried",
              "🔥 Hải sản ĐỒ KHÔ",
              "Không cần GPS • Đồ khô đóng hộp • Ship cod toàn quốc",
              C.warn,
              "#FEF5E4",
            ],
          ].map(([k, l, sub, ac, bg]) => (
            <button
              key={k}
              onClick={() => setType(k)}
              onMouseEnter={() => setHoveredType(k)}
              onMouseLeave={() => setHoveredType(null)}
              style={{
                padding: "20px",
                border: `2px solid ${type === k ? ac : hoveredType === k ? "#D1D5DB" : C.border}`,
                borderRadius: 12,
                cursor: "pointer",
                background: type === k ? bg : C.white,
                textAlign: "left",
                fontFamily: "inherit",
                boxShadow: type === k ? "0 4px 12px rgba(0,0,0,0.03)" : "none",
                transform: hoveredType === k ? "translateY(-1.5px)" : "none",
                transition: "all 0.25s ease",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 14, color: C.dark }}>
                {l}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.muted,
                  marginTop: 6,
                  lineHeight: 1.4,
                }}
              >
                {sub}
              </div>
            </button>
          ))}
        </div>
      </section>

      {type === "Fresh" && (
        <div
          style={{
            background: gps.status === "ok" ? C.okL : "#FEF3C7",
            border: `1px solid ${gps.status === "ok" ? C.ok : "#F59E0B"}`,
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.01)",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: gps.status === "ok" ? C.ok : "#92400E",
            }}
          >
            {gps.status === "ok"
              ? `✅ Đã nhận diện GPS: ${gps.lat?.toFixed(4)}, ${gps.lng?.toFixed(4)}`
              : "⚠️ Hải sản tươi bắt buộc phải bật định vị để khoanh vùng 20km"}
          </span>
          {gps.status !== "ok" && (
            <button
              onClick={getGps}
              style={{
                background: "#f59e0b",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "inherit",
                boxShadow: "0 2px 6px rgba(245, 158, 11, 0.35)",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#D97706")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#f59e0b")
              }
            >
              {gps.status === "loading" ? "Đang định vị..." : "📍 Bật GPS"}
            </button>
          )}
        </div>
      )}

      {type === "Fresh" && gps.status === "ok" && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: C.muted,
              marginBottom: 8,
            }}
          >
            📍 Khu vực bán hải sản tươi sống{" "}
            <span style={{ fontWeight: 400 }}>(tự động lấy từ GPS)</span>
          </div>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={() => setFocusedField("address")}
            onBlur={() => setFocusedField(null)}
            placeholder="VD: Phường Sơn Trà, Quận Sơn Trà, Đà Nẵng"
            style={getInputStyle("address")}
          />
        </div>
      )}

      <section
        style={{
          background: C.white,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          padding: 24,
          marginBottom: 16,
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: 13,
            marginBottom: 16,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Thông tin chi tiết mẻ hàng
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Dropdown Phân loại chi tiết (Category) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}
            >
              Phân loại mẻ hàng *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onFocus={() => setFocusedField("category")}
              onBlur={() => setFocusedField(null)}
              style={getInputStyle("category")}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}
            >
              Tên sản phẩm *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              placeholder="Tên hải sản (VD: Cá Thu Câu, Cá Bớp Cảng Sơn Trà...)"
              style={getInputStyle("name")}
            />
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}
              >
                Giá bán (VND/kg) *
              </label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onFocus={() => setFocusedField("price")}
                onBlur={() => setFocusedField(null)}
                placeholder="Đơn giá"
                style={getInputStyle("price")}
                type="number"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}
              >
                Trọng lượng (kg) *
              </label>
              <input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onFocus={() => setFocusedField("weight")}
                onBlur={() => setFocusedField(null)}
                placeholder="Khối lượng sẵn có"
                style={getInputStyle("weight")}
                type="number"
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}
            >
              Mô tả sản phẩm
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onFocus={() => setFocusedField("desc")}
              onBlur={() => setFocusedField(null)}
              placeholder="Mô tả chất lượng hải sản (VD: Mới đánh bắt còn bơi, ngọt béo...)"
              rows={4}
              style={{ ...getInputStyle("desc"), resize: "vertical" }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              background: "#E2E8F0",
              padding: 4,
              borderRadius: 12,
            }}
          >
            {[
              ["Retail", "🛒 Bán lẻ hải sản"],
              ["Wholesale", "📦 Bán sỉ buôn lô"],
            ].map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setSalesType(k)}
                style={{
                  padding: "10px",
                  border: "none",
                  borderRadius: 9,
                  cursor: "pointer",
                  background: salesType === k ? C.white : "transparent",
                  fontWeight: 700,
                  fontSize: 13,
                  color: salesType === k ? C.ocean : C.muted,
                  boxShadow:
                    salesType === k ? "0 4px 10px rgba(0,0,0,0.06)" : "none",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {type === "Fresh" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}
              >
                Thời gian đánh bắt *
              </label>
              <input
                value={catchTime}
                onChange={(e) => setCatchTime(e.target.value)}
                onFocus={() => setFocusedField("catchTime")}
                onBlur={() => setFocusedField(null)}
                style={getInputStyle("catchTime")}
                type="datetime-local"
              />
            </div>
          )}
          {type === "Dried" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--muted)",
                  }}
                >
                  Xuất xứ *
                </label>
                <input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  onFocus={() => setFocusedField("origin")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="VD: Phú Quốc"
                  style={getInputStyle("origin")}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--muted)",
                  }}
                >
                  Hạn sử dụng *
                </label>
                <input
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  onFocus={() => setFocusedField("expiry")}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle("expiry")}
                  type="date"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section
        style={{
          background: C.white,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          padding: 24,
          marginBottom: 16,
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContext: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: 13,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            📸 Hình ảnh thực tế mẻ hàng
          </div>
          {images.length > 0 && (
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>
              Đã chọn: {images.length} / 5 ảnh
            </span>
          )}
        </div>

        <label
          style={{
            display: "block",
            border: `2px dashed ${images.length > 0 ? C.ok : C.border}`,
            borderRadius: 12,
            padding: images.length > 0 ? "14px" : "32px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: images.length > 0 ? C.okL : C.bg,
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.ocean;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor =
              images.length > 0 ? C.ok : C.border;
          }}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) =>
              setImages((prev) => {
                const newFiles = Array.from(e.target.files);
                return [...prev, ...newFiles].slice(0, 5);
              })
            }
            style={{ display: "none" }}
          />
          {images.length === 0 ? (
            <>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ocean }}>
                Nhấn để chọn ảnh hải sản
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                Hỗ trợ PNG, JPG, WEBP
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: C.ok, fontWeight: 700 }}>
              ➕ Chọn thêm ảnh khác
            </div>
          )}
        </label>

        {images.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
              gap: 12,
              marginTop: 16,
            }}
          >
            {images.map((f, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img
                  src={URL.createObjectURL(f)}
                  alt=""
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    objectFit: "cover",
                    borderRadius: 10,
                    border: `2px solid ${i === 0 ? C.ocean : C.border}`,
                    display: "block",
                  }}
                />
                {i === 0 && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: "rgba(11, 79, 108, 0.85)",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 800,
                      textAlign: "center",
                      borderRadius: "0 0 8px 8px",
                      padding: "2px 0",
                    }}
                  >
                    Ảnh bìa chính
                  </div>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setImages((prev) => prev.filter((_, j) => j !== i))
                  }
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "#EF4444",
                    color: "#fff",
                    border: "2px solid #fff",
                    cursor: "pointer",
                    fontSize: 10,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {err && (
        <div
          style={{
            background: "#FEE2E2",
            color: "#991B1B",
            borderLeft: "4px solid #EF4444",
            padding: "12px 16px",
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          ⚠️ {err}
        </div>
      )}

      <button
        onClick={postCount.count >= postCount.max && !postCount.isPremium ? () => navigate("/profile") : submit}
        disabled={loading}
        style={{
          width: "100%",
          padding: 14,
          background: loading
            ? C.muted
            : postCount.count >= postCount.max && !postCount.isPremium
              ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
              : `linear-gradient(135deg, ${C.coral} 0%, #D94E21 100%)`,
          color: "#fff",
          border: "none",
          borderRadius: 12,
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 16,
          fontWeight: 700,
          fontFamily: "inherit",
          boxShadow: loading
            ? "none"
            : postCount.count >= postCount.max && !postCount.isPremium
              ? "0 4px 14px rgba(217, 119, 6, 0.3)"
              : "0 4px 14px rgba(232, 100, 58, 0.3)",
          transition: "all 0.25s ease",
        }}
      >
        {loading
          ? "⏳ Đang đăng bài bán..."
          : postCount.count >= postCount.max && !postCount.isPremium
            ? "🌟 Nâng cấp Premium để mở khoá Đăng bài"
            : "🚀 Đăng mẻ hàng ngay"}
      </button>
    </div>
  );
}
