import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";

export function Footer() {
  const vtNavigate = useViewTransitionNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div 
      className="foot_back" 
      style={{
        width: "100%",
        background: "linear-gradient(to bottom, #0d5f45, #083b2b)",
        backgroundSize: "auto",
        position: "relative",
        clear: "both"
      }}
    >
      <footer 
        id="footer" 
        style={{
          width: "100%",
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "80px 24px 60px",
          textAlign: "center",
          color: "#ffffff"
        }}
      >
        {/* Logo Section */}
        <p className="logo" style={{ marginBottom: "40px" }}>
          <Link to="/" style={{ display: "inline-block" }}>
            <img 
              loading="lazy" 
              src="/logo02.png" 
              alt="HảiSản.vn" 
              style={{ 
                maxHeight: "55px", 
                objectFit: "contain",
                transition: "transform 0.2s" 
              }} 
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1.00)"}
            />
          </Link>
        </p>

        {/* Text Links Section */}
        <p 
          className="text01" 
          style={{
            fontSize: "12px",
            lineHeight: "200%",
            margin: "0 auto 40px",
            maxWidth: "800px",
            color: "rgba(255, 255, 255, 0.85)"
          }}
        >
          <Link to="/" style={{ color: "#ffffff", textDecoration: "underline", margin: "0 6px" }}>
            HảiSản.vn - Hải Sản Tươi Ngon Từ Ngư Dân
          </Link>｜
          <Link to="/quy-trinh" style={{ color: "#ffffff", textDecoration: "underline", margin: "0 6px" }}>
            Giới thiệu dịch vụ thu mua hộ
          </Link>｜
          <Link to="/ngu-dan" style={{ color: "#ffffff", textDecoration: "underline", margin: "0 6px" }}>
            Danh sách ngư thuyền liên kết
          </Link>｜
          <Link to="/cong-thuc" style={{ color: "#ffffff", textDecoration: "underline", margin: "0 6px" }}>
            Bí quyết ẩm thực & Mẹo chế biến
          </Link>｜
          <Link to="/quy-trinh" style={{ color: "#ffffff", textDecoration: "underline", margin: "0 6px" }}>
            Quy trình & Hướng dẫn mua hàng
          </Link>
          <br />
          <Link to="/cong-dong" style={{ color: "#ffffff", textDecoration: "underline", margin: "0 6px" }}>
            Ý kiến phản hồi từ khách hàng
          </Link>｜
          <Link to="/san-pham" style={{ color: "#ffffff", textDecoration: "underline", margin: "0 6px" }}>
            Sản phẩm giao hàng hẹn giờ
          </Link>｜
          <Link to="/san-pham" style={{ color: "#ffffff", textDecoration: "underline", margin: "0 6px" }}>
            Hải sản tươi sống mới đánh bắt
          </Link>｜
          <Link to="/dinh-ky" style={{ color: "#ffffff", textDecoration: "underline", margin: "0 6px" }}>
            Đăng ký gói giao hải sản định kỳ
          </Link>｜
          <Link to="/dang-nhap" style={{ color: "#ffffff", textDecoration: "underline", margin: "0 6px" }}>
            Đăng ký thành viên miễn phí
          </Link>
          <br />
          <Link to="/profile" style={{ color: "#ffffff", textDecoration: "underline", margin: "0 6px" }}>
            Thông tin tài khoản
          </Link>｜
          <Link to="/dang-bai" style={{ color: "#ffffff", textDecoration: "underline", margin: "0 6px" }}>
            Đăng bài bán mẻ lưới mới
          </Link>｜
          <Link to="/dang-nhap" style={{ color: "#ffffff", textDecoration: "underline", margin: "0 6px" }}>
            Liên hệ hợp tác & Hỗ trợ ngư dân
          </Link>
          <br />
          <a href="https://yasai-tuuhan.com/" target="_blank" rel="noopener noreferrer" style={{ color: "#ffffff", textDecoration: "underline", margin: "0 6px" }}>
            Liên kết: Sàn rau củ hữu cơ nông sản Việt
          </a>
        </p>

        {/* Copyright Section */}
        <p className="copy" style={{ margin: "20px 0 0" }}>
          <img 
            loading="lazy" 
            src="/copy.png" 
            alt="Copyright c HảiSản.vn All Rights Reserved." 
            style={{ maxHeight: "14px", objectFit: "contain", opacity: 0.8 }}
          />
        </p>
      </footer>

      {/* Floating Scroll To Top Button */}
      <div
        onClick={scrollToTop}
        style={{
          position: "fixed",
          bottom: "40px",
          right: "40px",
          cursor: "pointer",
          zIndex: 999,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.8)",
          pointerEvents: isVisible ? "auto" : "none",
          transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-5px) scale(1.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = isVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.8)";
        }}
      >
        <img 
          src="/pagetop.png" 
          alt="Trở lại đầu trang" 
          style={{ 
            width: "50px", 
            height: "50px",
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.15))"
          }} 
        />
      </div>
    </div>
  );
}
