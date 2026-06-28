import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpenText,
  Crown,
  Fish,
  Heart,
  Home,
  LayoutDashboard,
  MessageSquare,
  Radio,
  Settings,
  ShieldCheck,
  Store,
  User,
  Users,
} from "lucide-react";

const buyerNavigation = [
  { label: "Trang chủ", path: "/", icon: Home },
  { label: "Chợ hải sản", path: "/marketplace", icon: Store },
  { label: "Đã lưu", path: "/buyer/favorites", icon: Heart },
  { label: "Tin nhắn", path: "/chat", icon: MessageSquare },
  { label: "Thông báo", path: "/notifications", icon: Bell },
  { label: "Premium", path: "/premium", icon: Crown, highlight: true },
  { label: "Hồ sơ", path: "/profile", icon: User },
];

const sellerNavigation = [
  { label: "Dashboard", path: "/seller", icon: LayoutDashboard, exact: true },
  { label: "Quản lý sản phẩm", path: "/seller/products", icon: Fish },
  { label: "Boat Log", path: "/seller/boat-log", icon: BookOpenText },
  { label: "Tin nhắn", path: "/chat", icon: MessageSquare },
  { label: "Premium", path: "/premium", icon: Crown, highlight: true },
  { label: "Thống kê", path: "/seller/statistics", icon: BarChart3 },
  { label: "Thông báo", path: "/notifications", icon: Bell },
  { label: "Hồ sơ", path: "/profile", icon: User },
];

const adminNavigation = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Quản lý User", path: "/admin/users", icon: Users },
  { label: "Duyệt sản phẩm", path: "/admin/listings", icon: ShieldCheck },
  { label: "Report", path: "/admin/reports", icon: AlertTriangle },
  { label: "Premium", path: "/admin/payments", icon: Crown },
  { label: "Broadcast", path: "/admin/broadcast", icon: Radio },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

const guestNavigation = [
  { label: "Trang chủ", path: "/", icon: Home },
  { label: "Chợ hải sản", path: "/marketplace", icon: Store },
];

export function getUserRole(user) {
  const role = user?.sessionRole || user?.role || "guest";
  if (role === "Seller" || role === "seller") return "seller";
  if (role === "Admin" || role === "admin") return "admin";
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
