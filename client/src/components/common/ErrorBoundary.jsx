import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-state" style={{ padding: "40px", textAlign: "center", minHeight: "60vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#ef4444", marginBottom: "12px" }}>Đã xảy ra sự cố giao diện</h2>
          <p style={{ margin: "0 0 24px 0", color: "#64748b", maxWidth: "480px", fontSize: "0.92rem", lineHeight: "1.6" }}>
            Chúng tôi rất tiếc vì sự bất tiện này. Một lỗi hiển thị của ứng dụng đã được ghi nhận. Bạn có thể thử tải lại trang hoặc quay lại trang chủ.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              className="button button--secondary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              type="button"
              style={{ padding: "10px 20px", borderRadius: "10px", fontWeight: "700" }}
            >
              Thử tải lại trang
            </button>
            <button
              className="button button--primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
              type="button"
              style={{ padding: "10px 24px", borderRadius: "10px", fontWeight: "700" }}
            >
              Quay lại trang chủ
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
