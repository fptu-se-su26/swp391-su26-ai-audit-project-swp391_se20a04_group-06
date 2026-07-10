/**
 * DateTimePicker — wrapper nhẹ quanh <input type="datetime-local">
 * với label, icon, format hiển thị thân thiện người Việt (dd/mm/yyyy HH:mm).
 *
 * Props:
 *   id          : string                — id duy nhất cho input (bắt buộc)
 *   label       : string                — nhãn hiển thị
 *   value       : string                — giá trị dạng "yyyy-MM-ddTHH:mm" (datetime-local format)
 *   onChange    : (value: string) => void — callback khi thay đổi
 *   required    : boolean               — bắt buộc hay không
 *   errorMsg    : string                — thông báo lỗi tuỳ chỉnh
 *   min         : string                — giới hạn min (datetime-local format)
 *   max         : string                — giới hạn max (datetime-local format)
 *   disabled    : boolean
 *
 * Helper utilities (exported):
 *   formatDateTimeForInput(isoOrDate)  → "yyyy-MM-ddTHH:mm"  (đưa vào input)
 *   parseDateTimeForSubmit(localValue) → ISO string hoặc null (gửi backend)
 */

import { CalendarClock } from "lucide-react";

/**
 * Chuyển ISO date string hoặc Date object → "yyyy-MM-ddTHH:mm"
 * phù hợp với input[type="datetime-local"].
 * Dùng múi giờ địa phương để hiển thị đúng giờ Việt Nam.
 */
export function formatDateTimeForInput(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  // Lấy theo giờ địa phương (không bị lệch UTC)
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/**
 * Chuyển giá trị "yyyy-MM-ddTHH:mm" từ input → ISO string cho backend.
 * Trả về null nếu rỗng / không hợp lệ.
 */
export function parseDateTimeForSubmit(localValue) {
  if (!localValue) return null;
  const d = new Date(localValue);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Định dạng giá trị "yyyy-MM-ddTHH:mm" → hiển thị "dd/mm/yyyy HH:mm"
 * chỉ dùng cho placeholder / hint.
 */
export function formatDisplayVN(localValue) {
  if (!localValue || localValue.length < 16) return "";
  const [datePart, timePart] = localValue.split("T");
  if (!datePart || !timePart) return "";
  const [y, m, d] = datePart.split("-");
  return `${d}/${m}/${y} ${timePart.slice(0, 5)}`;
}

// ─────────────────────────────────────────────────────────────────────────────

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
  const displayValue = formatDisplayVN(value);

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
        <input
          className="datetimepicker-input"
          disabled={disabled}
          id={id}
          max={max}
          min={min}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          type="datetime-local"
          value={value}
        />
        {displayValue && (
          <span className="datetimepicker-display" aria-hidden="true">
            {displayValue}
          </span>
        )}
      </div>

      {/* Thông báo lỗi tuỳ chỉnh hoặc hint format */}
      {errorMsg ? (
        <p className="datetimepicker-error" role="alert">{errorMsg}</p>
      ) : (
        <p className="datetimepicker-hint">Chọn ngày và giờ — hiển thị theo múi giờ Việt Nam</p>
      )}
    </div>
  );
}
