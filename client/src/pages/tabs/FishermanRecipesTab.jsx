import { useNavigate } from "react-router-dom";
import { C } from "../../utils/theme";
import { useApiFetch } from "../../hooks/useApiFetch";

export function FishermanRecipesTab({ sellerId }) {
  const navigate = useNavigate();
  const { data, loading } = useApiFetch(
    `/fishermen/${sellerId}/recipes?limit=9`,
    [sellerId],
  );

  const recipes = data?.data ?? data?.recipes ?? [];

  if (loading) {
    return (
      <div className="product-grid" style={{ gap: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer"
            style={{ height: 240, borderRadius: 12 }}
          />
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          background: C.white,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>🍳</div>
        <div style={{ fontWeight: 700, color: C.dark, marginBottom: 4 }}>
          Chưa có công thức nấu ăn
        </div>
        <div style={{ fontSize: 13, color: C.muted }}>
          Ngư dân chưa chia sẻ bí quyết chế biến nào.
        </div>
      </div>
    );
  }

  const diffLabel = { Easy: "Dễ", Medium: "Vừa", Hard: "Khó" };

  return (
    <div>
      <div className="product-grid" style={{ gap: 20, marginBottom: 24 }}>
        {recipes.map((r) => (
          <div
            key={r._id}
            onClick={() => navigate(`/cong-thuc/${r._id}`)}
            style={{
              background: C.white,
              borderRadius: 14,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
              cursor: "pointer",
              transition: "transform 0.25s ease, box-shadow 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Ảnh */}
            <div
              style={{
                height: 150,
                background: "#1a7060",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {r.imageUrl ? (
                <img
                  src={r.imageUrl}
                  alt={r.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 48,
                  }}
                >
                  🐟
                </div>
              )}
              <span
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 6,
                }}
              >
                {diffLabel[r.difficulty] ?? r.difficulty}
              </span>
            </div>

            {/* Nội dung */}
            <div style={{ padding: "12px 14px" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: C.dark,
                  marginBottom: 6,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {r.title}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  fontSize: 12,
                  color: C.muted,
                }}
              >
                <span>⏱️ {r.cookingTime} phút</span>
                <span>👥 {r.servings} người</span>
                <span>❤️ {r.likes?.length ?? 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data?.total > 9 && (
        <div style={{ textAlign: "center" }}>
          <button
            onClick={() => navigate(`/cong-thuc?authorId=${sellerId}`)}
            style={{
              background: C.white,
              border: `1.5px solid ${C.ocean}`,
              color: C.ocean,
              borderRadius: 10,
              padding: "10px 24px",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Xem thêm {data.total - 9} công thức →
          </button>
        </div>
      )}
    </div>
  );
}
