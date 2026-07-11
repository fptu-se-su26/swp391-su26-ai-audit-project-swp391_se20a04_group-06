/**
 * Formats a date relative to the current time in Vietnamese.
 * Supports:
 * - Vừa đăng (under 1 minute)
 * - x phút trước
 * - x giờ trước
 * - Hôm nay (if today and > 24 hours diff or similar fallback)
 * - Hôm qua
 * - dd/mm/yyyy (older than yesterday)
 * 
 * @param {Date | string | number} dateVal 
 * @returns {string}
 */
export function formatRelativeDate(dateVal) {
  if (!dateVal) return "";
  try {
    const now = new Date();
    const date = new Date(dateVal);
    
    // Validate date
    if (isNaN(date.getTime())) {
      return "";
    }

    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) {
      // For future or server clock mismatch
      return "Vừa đăng";
    }

    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) {
      return "Vừa đăng";
    }

    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) {
      return `${diffMins} phút trước`;
    }

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    }

    // Check calendar dates for Today/Yesterday
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (compareDate.getTime() === today.getTime()) {
      return "Hôm nay";
    }
    if (compareDate.getTime() === yesterday.getTime()) {
      return "Hôm qua";
    }

    // Format as dd/mm/yyyy
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `Đăng ngày ${day}/${month}/${year}`;
  } catch {
    return "";
  }
}
