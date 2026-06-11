import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    // Bạn có thể gửi log lên server ở đây
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}
        >
          <h2>⚠️ Có lỗi xảy ra</h2>
          <p>
            Chúng tôi đã ghi nhận và đang khắc phục. Vui lòng tải lại trang.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 16px",
              background: "#0B4F6C",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Tải lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
