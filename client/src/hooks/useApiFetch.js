// Nhập các hook useState, useEffect, và useCallback từ React để quản lý state và tối ưu hóa hàm
import { useState, useEffect, useCallback } from "react";
// Nhập module tiện ích gọi API chung từ thư mục services
import { api } from "../services/api";

// Custom hook useApiFetch tự động gọi API fetch dữ liệu từ path truyền vào, nhận dependencies để chạy lại
export function useApiFetch(path, deps = []) {
  // State lưu dữ liệu phản hồi nhận được từ API (mặc định ban đầu là null)
  const [data, setData] = useState(null);
  // State quản lý trạng thái tải (loading), mặc định là true nếu có truyền path, ngược lại là false
  const [loading, setLoading] = useState(!!path);
  // State lưu thông tin lỗi nếu cuộc gọi API thất bại (mặc định là null)
  const [error, setError] = useState(null);

  // Khởi tạo một số đếm fetchKey, mỗi lần tăng số này lên sẽ kích hoạt tải lại dữ liệu (refetch) thủ công
  const [fetchKey, setFetchKey] = useState(0);

  // Chuyển đổi mảng dependencies sang chuỗi JSON để so sánh thay đổi sâu một cách chính xác
  const depsKey = JSON.stringify(deps);

  // Lưu trữ các giá trị cũ (previous props/state) để phát hiện thay đổi và reset state kịp thời trong thân hàm render
  const [prevPath, setPrevPath] = useState(path);
  const [prevDepsKey, setPrevDepsKey] = useState(depsKey);
  const [prevFetchKey, setPrevFetchKey] = useState(fetchKey);

  // Nếu phát hiện path, mảng dependencies hoặc khóa refetch thay đổi so với lần render trước
  if (
    path !== prevPath ||
    depsKey !== prevDepsKey ||
    fetchKey !== prevFetchKey
  ) {
    // Cập nhật lại các giá trị cũ bằng giá trị mới nhất
    setPrevPath(path);
    setPrevDepsKey(depsKey);
    setPrevFetchKey(fetchKey);

    // Reset sạch sẽ các state dữ liệu, trạng thái tải và lỗi về mặc định để tránh hiển thị dữ liệu rác cũ
    setData(null);
    setLoading(!!path);
    setError(null);
  }

  // useEffect tự động gọi API mỗi khi path, chuỗi JSON của dependencies hoặc khóa refetch thay đổi
  useEffect(() => {
    // Nếu không có đường dẫn API (path rỗng), thoát ra ngay mà không gọi fetch
    if (!path) return; 

    // Khởi tạo AbortController giúp hủy bỏ yêu cầu mạng nếu dependencies thay đổi trước khi fetch hoàn thành
    const controller = new AbortController();
    const { signal } = controller;

    // Thực hiện gọi API với tín hiệu hủy signal
    api(path, { signal })
      .then((result) => {
        // Nếu yêu cầu mạng không bị hủy bỏ giữa chừng
        if (!signal.aborted) {
          // Lưu dữ liệu lấy được vào state data
          setData(result);
        }
      })
      .catch((e) => {
        // Nếu yêu cầu mạng bị hủy bỏ hoặc có lỗi AbortError thì bỏ qua không xử lý
        if (signal.aborted || e?.name === "AbortError") return;
        // Ngược lại, lưu thông điệp lỗi nhận được vào state error
        setError(e.message || "Lỗi không xác định");
      })
      .finally(() => {
        // Tắt trạng thái tải khi hoàn tất cuộc gọi API (nếu yêu cầu mạng không bị hủy)
        if (!signal.aborted) {
          setLoading(false);
        }
      });

    // Cleanup function: Tự động hủy yêu cầu mạng khi component bị unmount hoặc dependencies thay đổi
    return () => {
      controller.abort();
    };
  }, [path, depsKey, fetchKey]); // Theo dõi 3 tham số để chạy lại hiệu ứng mạng khi chúng thay đổi

  // Hàm refetch dùng useCallback để người dùng tự kích hoạt tải lại dữ liệu từ bên ngoài component
  const refetch = useCallback(() => {
    // Tăng số đếm lên 1 đơn vị để kích hoạt useEffect chạy lại
    setFetchKey((k) => k + 1);
  }, []); // Mảng dependency rỗng vì không phụ thuộc vào state nào khác bên ngoài

  // Trả về đối tượng chứa dữ liệu, trạng thái tải, lỗi và hàm tải lại dữ liệu
  return { data, loading, error, refetch };
}
