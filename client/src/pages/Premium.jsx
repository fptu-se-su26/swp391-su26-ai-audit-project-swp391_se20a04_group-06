import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Copy,
  Crown,
  Download,
  MapPin,
  Phone,
  QrCode,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiAuth, apiOmakase, apiPayment } from "../services/api";
import { useConfirm } from "../context/ConfirmContext";


const emptyForm = {
  plan: "Weekly",
  deliveryAddress: "",
  phone: "",
};

const paymentAssets = {
  qr: "/qr-payment.png",
  bankLogo: "/vietcombank-logo.png",
};

const paymentInfo = {
  bankName: "Ngân hàng TMCP Ngoại Thương Việt Nam",
  accountNumber: "1037922073",
  accountName: "To Minh Cuong",
  content: "TMC0430",
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const copyText = async (text) => {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

export default function Premium() {
  const { confirm, alert } = useConfirm();
  const { user, login } = useAuth();
  const [intent, setIntent] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [subscription, setSubscription] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setNotice("");

    const results = await Promise.allSettled([
      apiPayment.getPremiumIntent(),
      apiPayment.getStatus(),
      apiOmakase.getMine(),
    ]);

    if (results[0].status === "fulfilled") setIntent(results[0].value);
    if (results[1].status === "fulfilled") setPaymentStatus(results[1].value);
    if (results[2].status === "fulfilled") {
      const current = results[2].value?.subscription || null;
      setSubscription(current);
      if (current) {
        setForm({
          plan: current.plan,
          deliveryAddress: current.deliveryAddress,
          phone: current.phone,
        });
      }
    }

    const rejected = results.find((result) => result.status === "rejected");
    if (rejected) {
      setNotice(rejected.reason?.message || "Không thể tải thông tin gói.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshPayment = async () => {
    setBusy(true);
    try {
      const status = await apiPayment.getStatus();
      setPaymentStatus(status);
      const profile = await apiAuth.getProfile();
      login(profile);
      setNotice(
        status.isPremium
          ? "Thanh toán đã được xác nhận. Tài khoản đã là Premium!"
          : "Chưa ghi nhận thanh toán. Vui lòng kiểm tra lại sau ít phút.",
      );
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text) => {
    try {
      await copyText(text);
      setNotice("Đã sao chép nội dung chuyển khoản.");
    } catch {
      setNotice("Không thể sao chép. Vui lòng copy thủ công.");
    }
  };

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const subscribe = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const result = await apiOmakase.subscribe(form);
      setSubscription(result.subscription);
      setNotice("Đăng ký Omakase thành công.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    const ok = await confirm({
      title: "Hủy gói Omakase?",
      message: "Bạn có chắc chắn muốn hủy gói Omakase?",
      confirmText: "Hủy gói",
      variant: "danger"
    });
    if (!ok) return;
    setBusy(true);
    try {
      const result = await apiOmakase.cancel();
      setSubscription(result.subscription);
      setNotice("Đã hủy gói Omakase.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };


  const isPremium = Boolean(paymentStatus?.isPremium || user?.isPremium);
  const paymentAmount = Number(intent?.amount || 99000);
  const paymentAmountLabel = formatCurrency(paymentAmount);

  if (loading) return <div className="page-state">Đang tải thông tin Premium...</div>;

  return (
    <div className="page-container premium-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">THÀNH VIÊN PREMIUM</span>
          <h1>
            <Crown size={26} /> Premium & Omakase
          </h1>
          <p>
            Nâng cấp tài khoản bằng chuyển khoản Sepay và đăng ký hộp hải sản tuyển
            chọn định kỳ.
          </p>
        </div>
        <span className={`premium-status ${isPremium ? "is-active" : ""}`}>
          {isPremium ? <CheckCircle2 size={18} /> : <Crown size={18} />}
          {isPremium ? "Premium đang hoạt động" : "Tài khoản thường"}
        </span>
      </header>

      {notice && <p className="inline-notice">{notice}</p>}

      <div className="premium-grid">
        <section className="dashboard-panel premium-plan-card">
          <div className="premium-plan-icon">
            <Sparkles size={26} />
          </div>
          <span className="eyebrow">GÓI HẢI SẢN PREMIUM</span>
          <h2>{paymentAmountLabel}</h2>
          <p>
            Verified profile nổi bật, quyền truy cập Omakase và các ưu tiên dành cho
            thành viên Premium.
          </p>
          <ul>
            <li>
              <CheckCircle2 size={16} /> Mở đăng ký Omakase Weekly/Monthly
            </li>
            <li>
              <CheckCircle2 size={16} /> Hồ sơ và badge Premium nổi bật
            </li>
            <li>
              <CheckCircle2 size={16} /> Đối soát tự động qua webhook Sepay
            </li>
          </ul>
        </section>

        <section className="dashboard-panel premium-payment-card">
          <header className="premium-payment-header">
            <div>
              <h2>Thanh toán chuyển khoản</h2>
              <p>Quét mã QR hoặc dùng thông tin bên dưới để chuyển khoản.</p>
            </div>
          </header>

          {isPremium ? (
            <div className="premium-success">
              <CheckCircle2 size={42} />
              <strong>Tài khoản đã được nâng cấp</strong>
              <p>Bạn có thể đăng ký Omakase ngay bên dưới.</p>
            </div>
          ) : (
            <div className="premium-transfer-layout">
              <aside className="premium-transfer-qr">
                <p className="premium-transfer-steps">
                  <strong>Bước 1:</strong> Mở Ví điện tử/Ngân hàng
                  <br />
                  <strong>Bước 2:</strong> Chọn{" "}
                  <span className="premium-inline-icon">
                    <QrCode size={18} />
                  </span>{" "}
                  và quét mã
                </p>

                <div className="premium-qr-card">
                  <span className="premium-qr-corner premium-qr-corner--tl" />
                  <span className="premium-qr-corner premium-qr-corner--tr" />
                  <span className="premium-qr-corner premium-qr-corner--bl" />
                  <span className="premium-qr-corner premium-qr-corner--br" />
                  <img
                    alt="Mã QR thanh toán Premium"
                    className="premium-qr-image"
                    src={paymentAssets.qr}
                  />
                </div>

                <p className="premium-transfer-step">
                  <strong>Bước 3:</strong> Xác Nhận Chuyển Khoản
                </p>

                <a
                  className="button button--secondary premium-download-button"
                  download="premium-qr-tmc0430.png"
                  href={paymentAssets.qr}
                >
                  <Download size={16} /> Tải xuống Qrcode
                </a>
              </aside>

              <div className="premium-transfer-info">
                <p className="premium-transfer-support">
                  Hỗ trợ Ví điện tử MoMo/ZaloPay
                  <br />
                  Hoặc ứng dụng ngân hàng để chuyển khoản nhanh 24/7
                </p>

                <h3>Thông Tin Chuyển Khoản</h3>

                <dl className="premium-transfer-details">
                  <div>
                    <dt>Ngân hàng:</dt>
                    <dd className="premium-bank-row">
                      <span className="premium-bank-mark">
                        <img
                          alt="Logo Vietcombank"
                          src={paymentAssets.bankLogo}
                        />
                      </span>
                      <span>{paymentInfo.bankName}</span>
                    </dd>
                  </div>

                  <div>
                    <dt>STK:</dt>
                    <dd className="premium-copy-row">
                      <strong>{paymentInfo.accountNumber}</strong>
                      <button
                        aria-label="Sao chép số tài khoản"
                        onClick={() => copy(paymentInfo.accountNumber)}
                        type="button"
                      >
                        <Copy size={15} />
                      </button>
                    </dd>
                  </div>

                  <div>
                    <dt>Chủ tài khoản:</dt>
                    <dd>{paymentInfo.accountName}</dd>
                  </div>

                  <div>
                    <dt>Số tiền:</dt>
                    <dd>
                      <strong>{paymentAmountLabel}</strong>
                    </dd>
                  </div>

                  <div>
                    <dt>Nội dung thanh toán:</dt>
                    <dd className="premium-copy-row">
                      <span className="premium-content-pill">
                        {paymentInfo.content}
                      </span>
                      <button
                        aria-label="Sao chép nội dung thanh toán"
                        onClick={() => copy(paymentInfo.content)}
                        type="button"
                      >
                        <Copy size={15} />
                      </button>
                    </dd>
                  </div>
                </dl>

                <div className="premium-warning">
                  <strong>CHÚ Ý:</strong> CẦN CHUYỂN KHOẢN QUA QUÉT QR CODE ĐỂ XỬ LÝ
                  ĐƠN HÀNG TỰ ĐỘNG (KHÔNG chuyển khoản Thủ Công hay sửa thông tin khi
                  thực hiện)
                </div>

                <div className="premium-waiting">
                  <span className="premium-spinner" />
                  <span>Đang chờ xác nhận giao dịch</span>
                </div>
              </div>
            </div>
          )}

          <button
            className="button button--secondary"
            disabled={busy}
            onClick={refreshPayment}
            type="button"
          >
            <RefreshCw size={16} /> Kiểm tra trạng thái thanh toán
          </button>

          {paymentStatus?.latestTransaction && (
            <p className="payment-last-status">
              Giao dịch gần nhất:{" "}
              {formatCurrency(paymentStatus.latestTransaction.amount)} lúc{" "}
              {new Date(paymentStatus.latestTransaction.createdAt).toLocaleString(
                "vi-VN",
              )}
            </p>
          )}
        </section>
      </div>

      <section className="dashboard-panel omakase-panel">
        <header>
          <div>
            <span className="eyebrow">OMAKASE SUBSCRIPTION</span>
            <h2>Hộp hải sản tuyển chọn</h2>
            <p>
              Ngư dân chọn sản phẩm theo mùa và giao định kỳ đến địa chỉ của bạn.
            </p>
          </div>
          {subscription && (
            <span className={`subscription-badge is-${subscription.status?.toLowerCase()}`}>
              {subscription.status === "Active" ? (
                <CheckCircle2 size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {subscription.status}
            </span>
          )}
        </header>

        {subscription?.status === "Active" && (
          <div className="subscription-summary">
            <span>
              <CalendarClock size={17} /> {subscription.plan === "Weekly" ? "Hàng tuần" : "Hàng tháng"}
            </span>
            <span>
              <MapPin size={17} /> {subscription.deliveryAddress}
            </span>
            <span>
              <Phone size={17} /> {subscription.phone}
            </span>
            <span>Đợt giao tiếp theo: {new Date(subscription.nextDeliveryAt).toLocaleDateString("vi-VN")}</span>
          </div>
        )}

        <form className="form-grid" onSubmit={subscribe}>
          <label className="form-field">
            <span>Chu kỳ</span>
            <select
              disabled={!isPremium || busy}
              onChange={update("plan")}
              value={form.plan}
            >
              <option value="Weekly">Weekly — mỗi tuần</option>
              <option value="Monthly">Monthly — mỗi tháng</option>
            </select>
          </label>

          <label className="form-field">
            <span>Số điện thoại</span>
            <input
              disabled={!isPremium || busy}
              onChange={update("phone")}
              pattern="(?:\\+84|0)\\d{9,10}"
              placeholder="0901234567"
              required
              value={form.phone}
            />
          </label>

          <label className="form-field form-field--wide">
            <span>Địa chỉ giao hàng</span>
            <textarea
              disabled={!isPremium || busy}
              minLength="10"
              onChange={update("deliveryAddress")}
              required
              rows="3"
              value={form.deliveryAddress}
            />
          </label>

          <footer className="form-actions form-field--wide">
            <button
              className="button button--primary"
              disabled={!isPremium || busy}
              type="submit"
            >
              {subscription?.status === "Active" ? "Cập nhật gói" : "Đăng ký Omakase"}
            </button>
            {subscription?.status === "Active" && (
              <button
                className="button button--danger"
                disabled={busy}
                onClick={cancel}
                type="button"
              >
                Hủy gói
              </button>
            )}
          </footer>
        </form>

        {!isPremium && (
          <p className="muted-copy">
            Bạn cần hoàn tất nâng cấp Premium trước khi đăng ký Omakase.
          </p>
        )}
      </section>
    </div>
  );
}
