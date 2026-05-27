/**
 * useApiFetch.js
 *
 * PATTERN: Custom Hook Pattern (Strategy Pattern cho data fetching)
 *
 * Vấn đề cũ:
 *   - ProductDetailPageRoute và SellerProfilePageRoute trong App.jsx
 *     đều có cùng một đoạn code:
 *       const [data, setData] = useState(null);
 *       const [loading, setLoading] = useState(true);
 *       useEffect(() => { api(url).then().catch().finally() }, [id]);
 *
 *   - Pattern này lặp lại ở nhiều nơi khác trong các trang
 *
 * Giải pháp:
 *   - Một hook duy nhất đóng gói toàn bộ async fetching lifecycle
 *   - Hỗ trợ dependency list để refetch khi param thay đổi
 *   - Trả về { data, loading, error, refetch }
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../services/api";

/**
 * @param {string | null} path   - API path (vd: "/products/123"). Truyền null để skip fetch
 * @param {any[]} [deps=[]]      - Dependency array — hook sẽ refetch khi deps thay đổi
 * @returns {{ data, loading, error, refetch }}
 *
 * @example
 *   // Fetch product theo id từ URL param
 *   const { data: product, loading } = useApiFetch(`/products/${productId}`, [productId]);
 *
 *   // Fetch có điều kiện (chỉ fetch khi user đã đăng nhập)
 *   const { data: favorites } = useApiFetch(user ? "/favorites/ids" : null, [user?.id]);
 */
export function useApiFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!path); // false ngay nếu path=null
  const [error, setError] = useState(null);

  // Ref để tránh set state sau khi component unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!path) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api(path);
      if (mountedRef.current) setData(result);
    } catch (e) {
      if (mountedRef.current) setError(e.message || "Lỗi không xác định");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
