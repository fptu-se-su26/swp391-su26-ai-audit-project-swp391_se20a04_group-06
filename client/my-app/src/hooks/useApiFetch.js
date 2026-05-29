/**
 * useApiFetch.js
 *
 * PATTERN: Custom Hook Pattern
 *
 * FIXES:
 *   1. Dùng AbortController thay vì mountedRef — cancel fetch thực sự thay vì chỉ bỏ qua kết quả.
 *      Trước: fetch vẫn chạy trên network, chỉ bỏ qua setState → lãng phí bandwidth.
 *      Sau:  fetch bị hủy ngay khi component unmount hoặc deps thay đổi.
 *
 *   2. Fix infinite loop tiềm ẩn: trước đây deps array chứa cả `path` và `depsString`
 *      (trong đó depsString = JSON.stringify(deps) có thể chứa path). Bây giờ chỉ
 *      serialize `deps` array (không bao gồm `path`) để tránh double-trigger.
 *
 *   3. Thêm `refetch` callback để component có thể reload data on-demand.
 *
 *   4. Không gọi `setLoading(true)` đồng bộ ngay đầu effect — sẽ batch với React 18
 *      tự động, không cần wrapper Promise.resolve().
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../services/api";

export function useApiFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState(null);

  // Dùng counter để trigger refetch thủ công
  const [fetchKey, setFetchKey] = useState(0);

  // Serialize deps array (không include path để tránh duplicate trigger)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const depsKey = JSON.stringify(deps);

  useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // AbortController giúp cancel fetch thực sự trên network level
    const controller = new AbortController();
    const { signal } = controller;

    setLoading(true);
    setError(null);

    api(path, { signal })
      .then((result) => {
        if (!signal.aborted) {
          setData(result);
        }
      })
      .catch((e) => {
        // AbortError là expected behavior khi cleanup, không phải lỗi thật
        if (signal.aborted || e?.name === "AbortError") return;
        setError(e.message || "Lỗi không xác định");
      })
      .finally(() => {
        if (!signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
    // fetchKey cho phép refetch thủ công
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, depsKey, fetchKey]);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  return { data, loading, error, refetch };
}
