import { useState, useEffect, useCallback } from "react";

export default function useApiFetch(apiCall, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(options.immediate ? true : false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      if (options.onError) {
        options.onError(err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, options]);

  useEffect(() => {
    if (options.immediate) {
      execute().catch(() => {});
    }
  }, [execute, options.immediate]);

  return { data, loading, error, execute, setData };
}
