/**
 * DatePicker — sử dụng trực tiếp native input date cho UX tốt nhất.
 * Hiển thị nhãn VN, nút chọn lịch rõ ràng.
 */

import { Calendar } from "lucide-react";
import React from "react";

/* ── Các hàm tiện ích giữ nguyên export cho code khác dùng ── */

export function formatDatePickerMask(rawValue) {
  const digits = rawValue.replace(/\D/g, "");
  let formatted = "";
  if (digits.length > 0) formatted += digits.slice(0, 2);
  if (digits.length > 2) formatted += "/" + digits.slice(2, 4);
  if (digits.length > 4) formatted += "/" + digits.slice(4, 8);
  return formatted;
}

export function parseDateFromVN(displayVal) {
  if (!displayVal) return "";
  const parts = displayVal.split("/");
  if (parts.length === 3 && parts[2].length === 4) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return "";
}

export function formatDisplayDate(parentVal) {
  if (!parentVal) return "";
  const parts = parentVal.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }
  return parentVal;
}

/* ── Hàm chuyển đổi giá trị ISO/Date → date input (yyyy-MM-dd) ── */
function toDateInputValue(value) {
  if (!value) return "";
  // Nếu đã ở dạng yyyy-MM-dd thì giữ nguyên
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  // Nếu là ISO string hoặc Date
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* ── Hàm hiển thị ngày VN dễ đọc ── */
function toVNDisplayDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function DatePicker({
  id,
  label,
  value = "",
  onChange,
  required = false,
  disabled = false,
}) {
  const handleChange = (e) => {
    const val = e.target.value; // yyyy-MM-dd
    onChange(val || "");
  };

  const displayValue = toVNDisplayDate(value);

  return (
    <div className="datetimepicker-field">
      {label && (
        <label className="datetimepicker-label" htmlFor={id}>
          <Calendar size={14} />
          {label}
          {required && <span className="datetimepicker-required" aria-hidden="true">*</span>}
        </label>
      )}

      <div className={`datetimepicker-wrapper${disabled ? " is-disabled" : ""}`}>
        {/* Native date input — trình duyệt tự hiện UI chọn ngày */}
        <input
          className="datetimepicker-input datetimepicker-input--native"
          disabled={disabled}
          id={id}
          onChange={handleChange}
          required={required}
          type="date"
          value={toDateInputValue(value)}
        />
      </div>

      {/* Hiển thị giá trị đã chọn dạng VN */}
      {displayValue ? (
        <p className="datetimepicker-hint">📅 {displayValue}</p>
      ) : (
        <p className="datetimepicker-hint">Chọn ngày từ ô trên</p>
      )}
    </div>
  );
}
