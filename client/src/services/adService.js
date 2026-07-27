import apiClient from "./api";

export const MOCK_BUYER_ADS = [
  {
    id: "ad-sauce-01",
    targetRole: "buyer",
    badge: "Được tài trợ",
    sponsorName: "Chinsu Hải Sản",
    title: "Nước Chấm Chuyên Dụng Dùng Cho Hải Sản Tươi Sống",
    description: "Công thức sốt ớt xanh Nha Trang đậm đà & Nước mắm mặn chuẩn vị biển. Nâng tầm hương vị món ăn!",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
    ctaText: "Đặt mua ngay",
    ctaUrl: "https://chinsu.vn",
    tag: "Nước chấm & Gia vị",
  },
  {
    id: "ad-sauce-02",
    targetRole: "buyer",
    badge: "Được tài trợ",
    sponsorName: "Nước Mắm Phú Quốc",
    title: "Nước Mắm Cá Cơm Truyền Thống 40 Độ Đạm",
    description: "Ủ chượp thủ công 12 tháng tại đảo Ngọc Phú Quốc. Nguyên chất 100% không chất bảo quản.",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
    ctaText: "Xem ưu đãi 30%",
    ctaUrl: "https://nuocmamphuquoc.vn",
    tag: "Gia vị cao cấp",
  },
];

export const MOCK_SELLER_ADS = [
  {
    id: "ad-engine-01",
    targetRole: "seller",
    badge: "Được tài trợ",
    sponsorName: "Yamaha Marine VN",
    title: "Động Cơ Tàu Cá Outboard Yamaha 250HP - Tiết Kiệm Nhiên Liệu",
    description: "Bền bỉ vượt sóng khơi xa. Bảo hành chính hãng 3 năm & hỗ trợ trả góp lãi suất 0% cho Ngư dân.",
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    ctaText: "Khám phá động cơ",
    ctaUrl: "https://yamaha-motor.com.vn",
    tag: "Động cơ tàu biển",
  },
  {
    id: "ad-gear-02",
    targetRole: "seller",
    badge: "Được tài trợ",
    sponsorName: "Tập Đoàn Ngư Cụ Việt",
    title: "Lưới Cào & Dây Thừng Hàng Hải Siêu Bền Chịu Lực",
    description: "Chất liệu Sợi Polyethylene gia cường chịu lực nén đánh bắt xa bờ. Chiết khấu cao cho chủ tàu.",
    imageUrl: "https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&w=600&q=80",
    ctaText: "Liên hệ đại lý",
    ctaUrl: "https://ngucuviet.vn",
    tag: "Vật tư ngư nghiệp",
  },
];

export const adService = {
  async getTargetedAds(targetRole = "buyer") {
    try {
      const data = await apiClient.get("/ads", { params: { targetRole } });
      if (data && data.ads && data.ads.length > 0) {
        return data.ads;
      }
    } catch {
      // Fallback to client mock data if backend api is loading
    }
    return targetRole === "seller" ? MOCK_SELLER_ADS : MOCK_BUYER_ADS;
  },
};
