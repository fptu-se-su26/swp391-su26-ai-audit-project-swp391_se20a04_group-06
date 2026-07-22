/**
 * DateTimePicker — sử dụng trực tiếp native input datetime-local cho UX tốt nhất.
 * Hiển thị nhãn VN, nút chọn lịch rõ ràng, hỗ trợ min/max.
 */

import { CalendarClock } from "lucide-react";
import React from "react";

/* ── Các hàm tiện ích giữ nguyên export cho code khác dùng ── */

export function formatDateTimePickerMask(rawValue) {
  const digits = rawValue.replace(/\D/g, "");
  let formatted = "";
  if (digits.length > 0) formatted += digits.slice(0, 2);
  if (digits.length > 2) formatted += "/" + digits.slice(2, 4);
  if (digits.length > 4) formatted += "/" + digits.slice(4, 8);
  if (digits.length > 8) formatted += " " + digits.slice(8, 10);
  if (digits.length > 10) formatted += ":" + digits.slice(10, 12);
  return formatted;
}

export function parseDateTimeFromVN(displayVal) {
  if (!displayVal) return "";
  const [datePart, timePart] = displayVal.split(" ");
  if (!datePart || !timePart) return "";
  const dateParts = datePart.split("/");
  if (dateParts.length === 3 && dateParts[2].length === 4) {
    const [d, m, y] = dateParts;
    const timeParts2 = timePart.split(":");
    if (timeParts2.length === 2) {
      const [h, min] = timeParts2;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${h.padStart(2, "0")}:${min.padStart(2, "0")}`;
    }
  }
  return "";
}

export function formatDisplayDateTime(parentVal) {
  if (!parentVal) return "";
  const [datePart, timePart] = parentVal.split(/[T ]/);
  if (!datePart || !timePart) return "";
  const dateParts = datePart.split("-");
  if (dateParts.length === 3) {
    const [y, m, d] = dateParts;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y} ${timePart.slice(0, 5)}`;
  }
  return parentVal;
}

export function formatDateTimeForInput(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

export function parseDateTimeForSubmit(localValue) {
  if (!localValue) return null;
  const d = new Date(localValue);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/* ── Hàm chuyển đổi giá trị ISO/Date → datetime-local (yyyy-MM-ddTHH:mm) ── */
function toDatetimeLocalValue(value) {
  if (!value) return "";
  // Nếu đã ở dạng yyyy-MM-ddTHH:mm thì giữ nguyên
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 16);
  }
  // Nếu là ISO string hoặc Date
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ── Hàm hiển thị ngày giờ VN dễ đọc ── */
function toVNDisplayDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function DateTimePicker({
  id,
  label,
  value = "",
  onChange,
  required = false,
  errorMsg,
  min,
  max,
  disabled = false,
}) {
  const handleChange = (e) => {
    const val = e.target.value; // yyyy-MM-ddTHH:mm
    onChange(val || "");
  };

  const displayValue = toVNDisplayDateTime(value);

  return (
    <div className="datetimepicker-field">
      {label && (
        <label className="datetimepicker-label" htmlFor={id}>
          <CalendarClock size={14} />
          {label}
          {required && <span className="datetimepicker-required" aria-hidden="true">*</span>}
        </label>
      )}

      <div className={`datetimepicker-wrapper${disabled ? " is-disabled" : ""}`}>
        {/* Native datetime-local input — trình duyệt tự hiện UI chọn ngày/giờ */}
        <input
          className="datetimepicker-input datetimepicker-input--native"
          disabled={disabled}
          id={id}
          max={max}
          min={min}
          onChange={handleChange}
          required={required}
          type="datetime-local"
          value={toDatetimeLocalValue(value)}
        />
      </div>

      {/* Hiển thị giá trị đã chọn dạng VN */}
      {errorMsg ? (
        <p className="datetimepicker-error" role="alert">{errorMsg}</p>
      ) : displayValue ? (
        <p className="datetimepicker-hint">📅 {displayValue}</p>
      ) : (
        <p className="datetimepicker-hint">Chọn ngày và giờ từ ô trên</p>
      )}
    </div>
  );
}
