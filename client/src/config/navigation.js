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
  User,
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
  { label: "Diễn đàn", path: "/community", icon: UsersRound },
  { label: "Công thức", path: "/recipes", icon: ChefHat },
];

const sellerNavigation = [
  { label: "Xem chợ", path: "/marketplace", icon: Store },
  { label: "Tổng quan", path: "/seller", icon: LayoutDashboard, exact: true },
  { label: "Quản lý sản phẩm", path: "/seller/products", icon: Fish },
  { label: "Vựa cá", path: "/seller/landing-batches", icon: PackageOpen },
  { label: "Diễn đàn", path: "/community", icon: UsersRound },
  { label: "Công thức", path: "/recipes", icon: ChefHat },
];

const adminNavigation = [
  { label: "Xem chợ", path: "/marketplace", icon: Store },
  { label: "Tổng quan", path: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Quản lý người dùng", path: "/admin/users", icon: Users },
  { label: "Duyệt sản phẩm", path: "/admin/listings", icon: ShieldCheck },
  { label: "Vựa cá", path: "/admin/landing-batches", icon: PackageOpen },
  { label: "Báo cáo vi phạm", path: "/admin/reports", icon: AlertTriangle },
  { label: "Doanh thu gói", path: "/admin/payments", icon: Crown },
  { label: "Phát sóng", path: "/admin/broadcast", icon: Radio },
];

const guestNavigation = [
  { label: "Trang chủ", path: "/", icon: Home },
  { label: "Chợ hải sản", path: "/marketplace", icon: Store },
  { label: "Diễn đàn", path: "/community", icon: UsersRound },
  { label: "Công thức", path: "/recipes", icon: ChefHat },
];

export function getUserRole(user) {
  if (!user) return "guest";
  if (user.role === "Admin" || user.role === "admin") return "admin";
  if (user.isPremium || user.isVerified) return "seller";
  return "buyer";
}

export function getNavigation(user, pathname) {
  const role = getUserRole(user);
  if (role === "admin" && pathname?.startsWith("/admin")) return adminNavigation;
  if (pathname?.startsWith("/seller")) return sellerNavigation;
  if (user) {
    return buyerNavigation;
  }
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
