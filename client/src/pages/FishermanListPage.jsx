import { useState, useEffect, useRef, useCallback } from "react";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { useSEO } from "../hooks/useSEO";
import { FishermanCard } from "../components/FishermanCard";

const PAGE_SIZE = 20;

export function FishermanListPage() {
  useSEO({
    title: "Mạng Lưới Ngư Dân Bản Địa | Haisan.vn",
    description:
      "Khám phá cộng đồng ngư dân và tàu cá đánh bắt trực tiếp trên Haisan.vn.",
  });

  const [fishermen, setFishermen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);

  const sentinelRef = useRef(null);
  const stateRef = useRef({ page, hasMore, loadingMore, loading });

  useEffect(() => {
    stateRef.current = { page, hasMore, loadingMore, loading };
  }, [page, hasMore, loadingMore, loading]);

  const buildParams = useCallback(
    (pageNum) => {
      const p = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      if (search) p.set("search", search);
      if (onlyVerified) p.set("verified", "true");
      return p.toString();
    },
    [search, onlyVerified],
  );

  // Fetch trang đầu (reset)
  const fetchPage1 = useCallback(async () => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    try {
      const data = await api(`/fishermen?${buildParams(1)}`);
      const items = data.data ?? [];
      setFishermen(items);
      setTotal(data.total ?? 0);
      setHasMore(items.length === PAGE_SIZE);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    const t = setTimeout(fetchPage1, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchPage1, search]); // ← thêm search

  // Infinite scroll — load more
  const fetchMore = useCallback(async () => {
    const s = stateRef.current;
    if (s.loadingMore || !s.hasMore || s.loading) return;
    setLoadingMore(true);
    const nextPage = s.page + 1;
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (onlyVerified) params.set("verified", "true");
      const data = await api(`/fishermen?${params}`);
      const items = data.data ?? [];
      setFishermen((prev) => [...prev, ...items]);
      setPage(nextPage);
      setHasMore(items.length === PAGE_SIZE);
    } catch {
      /* silent */
    } finally {
      setLoadingMore(false);
    }
  }, [search, onlyVerified]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchMore();
      },
      { rootMargin: "200px" },
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchMore]);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: C.dark,
            marginBottom: 8,
          }}
        >
          🚢 Mạng Lưới Ngư Dân Haisan.vn
        </h1>
        <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
          {total > 0 ? `${total} ngư dân đang hoạt động` : "Đang tải..."}
        </p>
      </div>

      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 14,
              color: C.muted,
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên ngư dân..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 36px",
              borderRadius: 10,
              border: `1.5px solid ${C.border}`,
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
              background: C.white,
            }}
          />
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            color: C.text,
            cursor: "pointer",
            padding: "10px 16px",
            borderRadius: 10,
            border: `1.5px solid ${onlyVerified ? C.ocean : C.border}`,
            background: onlyVerified ? "#E6F4F9" : C.white,
            transition: "all 0.2s",
          }}
        >
          <input
            type="checkbox"
            checked={onlyVerified}
            onChange={(e) => setOnlyVerified(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: C.ocean }}
          />
          ✓ Chỉ đã xác minh
        </label>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer"
              style={{ height: 80, borderRadius: 14 }}
            />
          ))}
        </div>
      ) : fishermen.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            background: C.white,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 700, color: C.dark, marginBottom: 6 }}>
            Không tìm thấy ngư dân
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>
            Thử thay đổi từ khóa tìm kiếm
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {fishermen.map((f) => (
            <FishermanCard key={f.id} fisherman={f} size="full" />
          ))}
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} style={{ height: 1, marginTop: 32 }} />

      {loadingMore && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 12,
          }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer"
              style={{ height: 80, borderRadius: 14 }}
            />
          ))}
        </div>
      )}

      {!hasMore && fishermen.length > PAGE_SIZE && (
        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            color: C.muted,
            marginTop: 28,
            fontWeight: 600,
          }}
        >
          Đã hiển thị tất cả {fishermen.length} ngư dân
        </div>
      )}
    </div>
  );
}
