import { C } from "../utils/theme";
import { useApiFetch } from "../hooks/useApiFetch";
import { FishermanCard } from "./FishermanCard";
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";

// ── Hardcode fallback (giữ nguyên từ HomePage hiện tại khi API fail) ──────
const HARDCODE_FALLBACK = [
  { id: null, img: "/n_ryo01.png", name: "Ngư dân Sasaoka", loc: "Côn Đảo" },
  { id: null, img: "/n_ryo02.png", name: "Tàu Kadoshima", loc: "Hạ Long" },
  {
    id: null,
    img: "/n_ryo03.png",
    name: "Hộ thuyền Kim Vinh",
    loc: "Vũng Tàu",
  },
  { id: null, img: "/n_ryo04.png", name: "HTX Misaki", loc: "Vịnh Bắc Bộ" },
  { id: null, img: "/n_ryo05.png", name: "Tàu Bangmeemaru", loc: "Sông Đốc" },
  { id: null, img: "/n_ryo06.png", name: "Tàu Matsueimaru", loc: "Phu Quoc" },
  { id: null, img: "/n_ryo07.png", name: "Đầm hào Honjyo", loc: "Nha Trang" },
  { id: null, img: "/n_ryo08.png", name: "Tàu Horyomaru", loc: "Phan Thiết" },
  { id: null, img: "/n_ryo09.png", name: "Thủy sản Konishi", loc: "Cát Bà" },
  { id: null, img: "/n_ryo10.png", name: "HTX Arifuku", loc: "Kê Gà" },
  { id: null, img: "/n_ryo11.png", name: "Tàu Fudomaru", loc: "Vân Đồn" },
  { id: null, img: "/n_ryo12.png", name: "Thủy sản Kurobe", loc: "Cửa Lò" },
  { id: null, img: "/n_ryo13.png", name: "Tàu Shotokumaru", loc: "Vũng Tàu" },
  { id: null, img: "/n_ryo14.png", name: "Tàu câu Katuura", loc: "Đà Nẵng" },
  { id: null, img: "/n_ryo15.png", name: "HTX Lý Sơn", loc: "Quảng Ngãi" },
  { id: null, img: "/n_ryo16.png", name: "Thủy sản Aita", loc: "Vịnh Hạ Long" },
  { id: null, img: "/n_ryo17.png", name: "Tàu Yamatake", loc: "Đồ Sơn" },
];

function HardcodeFallbackGrid() {
  const navigate = useViewTransitionNavigate();
  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}
    >
      {HARDCODE_FALLBACK.map((item, i) => (
        <div
          key={i}
          onClick={() => navigate("/ngu-dan")}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            cursor: "pointer",
            padding: "8px 12px",
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            background: "#FAFAFA",
            transition: "all 0.22s",
            textAlign: "center",
            width: 110,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.borderColor = C.ocean;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = C.border;
          }}
        >
          <img
            src={item.img}
            alt={item.name}
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: 6,
              border: `2px solid ${C.border}`,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.dark,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              width: "100%",
            }}
          >
            {item.name}
          </span>
          <span style={{ fontSize: 9, color: C.muted }}>📍 {item.loc}</span>
        </div>
      ))}
    </div>
  );
}

export function FishermanGrid({ limit = 17, onViewAll }) {
  const { data, loading, error } = useApiFetch(
    `/fishermen?limit=${limit}&hasActive=true`,
    [],
  );

  // Fallback graceful nếu API lỗi hoặc chưa có
  if (error) return <HardcodeFallbackGrid onViewAll={onViewAll} />;

  if (loading) {
    return (
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}
      >
        {Array.from({ length: limit }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer"
            style={{ width: 110, height: 100, borderRadius: 12 }}
          />
        ))}
      </div>
    );
  }

  const fishermen = data?.data ?? [];

  // Nếu không có data thật → fallback hardcode
  if (fishermen.length === 0)
    return <HardcodeFallbackGrid onViewAll={onViewAll} />;

  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}
    >
      {fishermen.map((f) => (
        <FishermanCard key={f.id} fisherman={f} size="compact" />
      ))}
    </div>
  );
}
