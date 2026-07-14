import {
  AlertTriangle,
  BookOpenText,
  Crown,
  Fish,
  PackageOpen,
  Heart,
  Home,
  LayoutDashboard,
  Radio,
  Settings,
  ShieldCheck,
  Store,
  Users,
  UsersRound,
  ChefHat,
  Trophy,
} from "lucide-react";

const buyerNavigation = [
  { label: "Trang chủ", path: "/", icon: Home },
  { label: "Chợ hải sản", path: "/marketplace", icon: Store },
  { label: "Cộng đồng", path: "/community", icon: UsersRound },
  { label: "Công thức", path: "/recipes", icon: ChefHat },
  { label: "Nhật ký biển", path: "/boat-log", icon: BookOpenText },
  { label: "Xếp hạng", path: "/leaderboard", icon: Trophy },
  { label: "Đã lưu", path: "/buyer/favorites", icon: Heart },
];

const sellerNavigation = [
  { label: "Tổng quan", path: "/seller", icon: LayoutDashboard, exact: true },
  { label: "Quản lý sản phẩm", path: "/seller/products", icon: Fish },
  { label: "Vựa cá", path: "/seller/landing-batches", icon: PackageOpen },
  { label: "Cộng đồng", path: "/community", icon: UsersRound },
  { label: "Công thức", path: "/recipes", icon: ChefHat },
  { label: "Nhật ký biển", path: "/seller/boat-log", icon: BookOpenText },
];

const adminNavigation = [
  { label: "Tổng quan", path: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Quản lý người dùng", path: "/admin/users", icon: Users },
  { label: "Duyệt sản phẩm", path: "/admin/listings", icon: ShieldCheck },
  { label: "Vựa cá", path: "/admin/landing-batches", icon: PackageOpen },
  { label: "Báo cáo vi phạm", path: "/admin/reports", icon: AlertTriangle },
  { label: "Doanh thu gói", path: "/admin/payments", icon: Crown },
  { label: "Phát sóng", path: "/admin/broadcast", icon: Radio },
  { label: "Cài đặt", path: "/admin/settings", icon: Settings },
];


const guestNavigation = [
  { label: "Trang chủ", path: "/", icon: Home },
  { label: "Chợ hải sản", path: "/marketplace", icon: Store },
  { label: "Cộng đồng", path: "/community", icon: UsersRound },
  { label: "Công thức", path: "/recipes", icon: ChefHat },
  { label: "Xếp hạng", path: "/leaderboard", icon: Trophy },
];

export function getUserRole(user) {
  if (user?.role === "Admin" || user?.role === "admin") return "admin";
  const role = user?.sessionRole || user?.role || "guest";
  if (role === "Seller" || role === "seller") return "seller";
  if (role === "User" || role === "Buyer" || role === "buyer") return "buyer";
  return "guest";
}

export function getNavigation(user) {
  const role = getUserRole(user);
  if (role === "seller") return sellerNavigation;
  if (role === "admin") return adminNavigation;
  if (role === "buyer") return buyerNavigation;
  return guestNavigation;
}

export const workspaceNavigation = {
  seller: sellerNavigation,
  admin: adminNavigation,
};

export const roleMeta = {
  guest: { label: "Khách", color: "#64748b" },
  buyer: { label: "Người mua", color: "#0ea5e9" },
  seller: { label: "Ngư dân", color: "#10b981" },
  admin: { label: "Quản trị viên", color: "#f59e0b" },
};
