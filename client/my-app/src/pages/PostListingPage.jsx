import React, { useState, useRef } from "react";
import { C } from "../utils/theme";
import { api } from "../services/api";
export function PostListingPage({ user, setPage }) {
  const [type, setType] = useState("Fresh");
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
    setGps((g) => ({ ...g, status: "loading" }));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setGps({ status: "ok", lat, lng });
          // Reverse geocoding via Nominatim
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
          } catch {}
        },
        () => setGps({ status: "denied", lat: null, lng: null }),
      );
    } else setGps({ status: "denied", lat: null, lng: null });
  };

  const submit = async () => {
    setErr("");
    if (!name || !price || !weight)
      return setErr("Vui lòng điền đầy đủ tên, giá và khối lượng");
    if (type === "Fresh" && gps.status !== "ok")
      return setErr("Bắt buộc bật GPS để đăng hải sản tươi");

    setLoading(true);
    try {
      const body = {
        type,
        name,
        description: desc,
        price,
        salesType,
        totalWeight: weight,
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
      const res = await api("/products", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const productId = res.productId;

      // Upload ảnh nếu có
      if (images.length > 0) {
        const fd = new FormData();
        images.forEach((f) => fd.append("images", f));
        await api(`/products/${productId}/images`, {
          method: "POST",
          body: fd,
        });
      }
      setDone(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
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

      {/* Type */}
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

      {/* GPS */}
      {type === "Fresh" && (
        <div
          style={{
            background: gps.status === "ok" ? C.okL : C.warnL,
            border: `1px solid ${gps.status === "ok" ? C.ok : C.warn}`,
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
              color: gps.status === "ok" ? C.ok : "#92400E",
            }}
          >
            {gps.status === "ok"
              ? `✅ GPS: ${gps.lat?.toFixed(4)}, ${gps.lng?.toFixed(4)}`
              : "⚠️ Bắt buộc bật GPS khi đăng hải sản tươi"}
          </span>
          {gps.status !== "ok" && (
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
              {gps.status === "loading" ? "Đang lấy..." : "📍 Bật GPS"}
            </button>
          )}
        </div>
      )}

      {/* Address from GPS */}
      {type === "Fresh" && gps.status === "ok" && (
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: C.muted,
              marginBottom: 6,
            }}
          >
            📍 Khu vực bán{" "}
            <span style={{ fontWeight: 400 }}>
              (tự động từ GPS, có thể chỉnh)
            </span>
          </div>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="VD: Phường Sơn Trà, Quận Sơn Trà"
            style={{
              width: "100%",
              padding: "11px 14px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 10,
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
        </div>
      )}

      {/* Form */}
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
            placeholder="Mô tả (tươi, độ béo, nơi đánh bắt...)"
            rows={3}
            style={{ ...inp, resize: "vertical" }}
          />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            {[
              ["Retail", "🛒 Bán lẻ"],
              ["Wholesale", "📦 Bán buôn"],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setSalesType(k)}
                style={{
                  padding: "10px",
                  border: `2px solid ${salesType === k ? C.ocean : C.border}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  background: salesType === k ? C.oceanP : "transparent",
                  fontWeight: 700,
                  fontSize: 13,
                  color: salesType === k ? C.ocean : C.muted,
                  fontFamily: "inherit",
                }}
              >
                {l}
              </button>
            ))}
          </div>
          {type === "Fresh" && (
            <input
              value={catchTime}
              onChange={(e) => setCatchTime(e.target.value)}
              placeholder="Thời gian đánh bắt"
              style={inp}
              type="datetime-local"
            />
          )}
          {type === "Dried" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Xuất xứ (VD: Phú Quốc)"
                style={inp}
              />
              <input
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="Hạn sử dụng"
                style={inp}
                type="date"
              />
            </div>
          )}
        </div>
      </section>

      {/* Images */}
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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>
            📸 Ảnh sản phẩm{" "}
            <span style={{ color: C.muted, fontWeight: 400 }}>
              (tối đa 5 ảnh)
            </span>
          </div>
          {images.length > 0 && (
            <span style={{ fontSize: 12, color: C.muted }}>
              {images.length}/5 ảnh
            </span>
          )}
        </div>

        {/* Drop zone */}
        <label
          style={{
            display: "block",
            border: `2px dashed ${images.length > 0 ? C.ok : C.border}`,
            borderRadius: 10,
            padding: images.length > 0 ? "12px" : "28px 16px",
            textAlign: "center",
            cursor: "pointer",
            background: images.length > 0 ? C.okL : C.bg,
            transition: "all 0.2s",
          }}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) =>
              setImages((prev) => {
                const newFiles = Array.from(e.target.files);
                const combined = [...prev, ...newFiles].slice(0, 5);
                return combined;
              })
            }
            style={{ display: "none" }}
          />
          {images.length === 0 ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 6 }}>🖼️</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ocean }}>
                Nhấn để chọn ảnh
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                JPG, PNG · Tối đa 5 ảnh
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: C.ok, fontWeight: 600 }}>
              + Thêm ảnh
            </div>
          )}
        </label>

        {/* Preview grid */}
        {images.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
              gap: 10,
              marginTop: 12,
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
                    borderRadius: 8,
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
                      background: "rgba(11,79,108,0.75)",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      textAlign: "center",
                      borderRadius: "0 0 6px 6px",
                      padding: "2px 0",
                    }}
                  >
                    Ảnh bìa
                  </div>
                )}
                <button
                  onClick={() =>
                    setImages((prev) => prev.filter((_, j) => j !== i))
                  }
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#EF4444",
                    color: "#fff",
                    border: "2px solid #fff",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
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
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          ⚠️ {err}
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading}
        style={{
          width: "100%",
          padding: 14,
          background: loading ? C.muted : C.coral,
          color: "#fff",
          border: "none",
          borderRadius: 12,
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 16,
          fontWeight: 700,
          fontFamily: "inherit",
        }}
      >
        {loading ? "⏳ Đang đăng..." : "🚀 Đăng bài ngay"}
      </button>
    </div>
  );
}
