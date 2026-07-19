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
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-state" style={{ padding: "40px", textAlign: "center", minHeight: "60vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.8rem", color: "var(--market-danger, #ef4444)", marginBottom: "16px" }}>Đã xảy ra sự cố giao diện</h2>
          <p style={{ margin: "10px 0 24px 0", color: "var(--market-text-muted, #9ca3af)", maxWidth: "480px" }}>
            Chúng tôi rất tiếc vì sự bất tiện này. Một lỗi hiển thị của ứng dụng đã được ghi nhận. Vui lòng quay lại trang chủ.
          </p>
          <button
            className="button button--primary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = "/";
            }}
            type="button"
            style={{ padding: "10px 24px", borderRadius: "8px", fontWeight: "bold" }}
          >
            Quay lại trang chủ
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
