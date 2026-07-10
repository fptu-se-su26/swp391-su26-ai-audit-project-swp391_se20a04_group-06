import { MessageSquareText, Phone, X } from "lucide-react";
import { useState } from "react";

const facebookUrl =
  import.meta.env.VITE_CONTACT_FACEBOOK_URL || "https://www.facebook.com/";
const zaloUrl =
  import.meta.env.VITE_CONTACT_ZALO_URL || "https://zalo.me/";
const contactPhone = String(
  import.meta.env.VITE_CONTACT_PHONE || "",
).replace(/[^\d+]/g, "");

function FacebookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M13.7 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H17V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.4V10H7.5v3h2.8v8h3.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ZaloIcon() {
  return (
    <span aria-hidden="true" className="floating-contact__zalo-mark">
      Zalo
    </span>
  );
}

export default function FloatingContact() {
  const [open, setOpen] = useState(false);

  return (
    <aside
      aria-label="Kênh liên hệ"
      className={`floating-contact${open ? " is-open" : ""}`}
    >
      {open ? (
        <div className="floating-contact__stack">
          <a
            aria-label="Liên hệ qua Facebook"
            className="floating-contact__button floating-contact__button--facebook"
            href={facebookUrl}
            rel="noreferrer"
            target="_blank"
            title="Facebook"
          >
            <FacebookIcon />
          </a>

          {contactPhone ? (
            <a
              aria-label={`Gọi hotline ${contactPhone}`}
              className="floating-contact__button floating-contact__button--phone"
              href={`tel:${contactPhone}`}
              title={`Gọi ${contactPhone}`}
            >
              <Phone size={25} />
            </a>
          ) : (
            <button
              aria-label="Hotline chưa được cấu hình"
              className="floating-contact__button floating-contact__button--phone"
              disabled
              title="Thêm VITE_CONTACT_PHONE để bật gọi điện"
              type="button"
            >
              <Phone size={25} />
            </button>
          )}

          <a
            aria-label="Liên hệ qua Zalo"
            className="floating-contact__button floating-contact__button--zalo"
            href={zaloUrl}
            rel="noreferrer"
            target="_blank"
            title="Zalo"
          >
            <ZaloIcon />
          </a>

          <button
            aria-label="Đóng menu liên hệ"
            className="floating-contact__button floating-contact__button--close"
            onClick={() => setOpen(false)}
            title="Đóng"
            type="button"
          >
            <X size={31} strokeWidth={2.8} />
          </button>
        </div>
      ) : (
        <button
          aria-expanded="false"
          aria-label="Mở các kênh liên hệ"
          className="floating-contact__trigger"
          onClick={() => setOpen(true)}
          type="button"
        >
          <span className="floating-contact__trigger-icon">
            <MessageSquareText size={25} />
          </span>
          <span className="floating-contact__label">Liên hệ</span>
        </button>
      )}
    </aside>
  );
}
