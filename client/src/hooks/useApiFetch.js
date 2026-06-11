import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

export function useApiFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState(null);

  // Dùng counter để trigger refetch thủ công
  const [fetchKey, setFetchKey] = useState(0);

  // Serialize deps array
  const depsKey = JSON.stringify(deps);

  // 🌟 KHẮC PHỤC: Điều chỉnh State trực tiếp trong thân hàm Render (Derived State / Previous Props)
  // Đây là giải pháp chuẩn chỉnh từ React Docs giúp reset state sạch sẽ khi props thay đổi mà không gây Cascading Renders
  const [prevPath, setPrevPath] = useState(path);
  const [prevDepsKey, setPrevDepsKey] = useState(depsKey);
  const [prevFetchKey, setPrevFetchKey] = useState(fetchKey);

  if (
    path !== prevPath ||
    depsKey !== prevDepsKey ||
    fetchKey !== prevFetchKey
  ) {
    setPrevPath(path);
    setPrevDepsKey(depsKey);
    setPrevFetchKey(fetchKey);

    setData(null);
    setLoading(!!path);
    setError(null);
  }

  useEffect(() => {
    if (!path) return; // Nếu không có path, thoát ra (giao diện đã được dọn sạch ở bước render phía trên)

    // AbortController giúp cancel fetch thực sự trên network level
    const controller = new AbortController();
    const { signal } = controller;

    // Đã loại bỏ hoàn toàn các câu lệnh setLoading(true) và setError(null) đồng bộ tại đây!

    api(path, { signal })
      .then((result) => {
        if (!signal.aborted) {
          setData(result);
        }
      })
      .catch((e) => {
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
  }, [path, depsKey, fetchKey]);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  return { data, loading, error, refetch };
}
