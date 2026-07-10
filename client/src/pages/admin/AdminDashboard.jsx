import { useCallback, useEffect, useState } from "react";
import {
  Award,
  FileText,
  MessageSquareWarning,
  RefreshCw,
  ShieldAlert,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { Route, Routes } from "react-router-dom";
import {
  apiAdmin,
  apiLandingBatches,
  apiReports,
} from "../../services/api";
import { formatLandingDateTime, getLandingBatchId } from "../../utils/landingBatch";
import { useConfirm } from "../../context/ConfirmContext";


const unwrapRows = (payload) =>
  Array.isArray(payload) ? payload : payload?.data || [];

function PageHeader({ eyebrow, title, description, onRefresh }) {
  return (
    <header className="page-heading page-heading--compact">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {onRefresh && (
        <button className="button button--ghost" onClick={onRefresh} type="button">
          <RefreshCw size={16} /> Làm mới
        </button>
      )}
    </header>
  );
}

function AdminOverview({ stats, pendingReports, onRefresh }) {
  const metrics = [
    { icon: Users, label: "Thành viên", value: stats.totalUsers || 0, tone: "blue" },
    { icon: Award, label: "Đã xác minh", value: stats.verifiedUsers || 0, tone: "amber" },
    {
      icon: FileText,
      label: "Sản phẩm đang bán",
      value: (stats.activeFresh || 0) + (stats.activeDried || 0),
      tone: "green",
    },
    {
      icon: ShieldAlert,
      label: "Báo cáo chờ xử lý",
      value: pendingReports.length,
      tone: "rose",
    },
  ];

  return (
    <div className="admin-overview">
      <PageHeader
        description="Số liệu trực tiếp từ hệ thống HảiSản.vn."
        eyebrow="ADMIN DASHBOARD"
        onRefresh={onRefresh}
        title="Tổng quan hệ thống"
      />
      <div className="dashboard-metrics admin-metrics">
        {metrics.map(({ icon: Icon, label, tone, value }) => (
          <article className={`dashboard-metric dashboard-metric--${tone}`} key={label}>
            <Icon size={21} /><span>{label}</span><strong>{value}</strong>
          </article>
        ))}
      </div>
      <section className="dashboard-panel">
        <header>
          <div><h2>Chất lượng cộng đồng</h2><p>Các chỉ số tương tác và uy tín toàn sàn.</p></div>
        </header>
        <div className="dashboard-metrics admin-metrics">
          <article className="dashboard-metric"><Star size={20} /><span>Điểm trung bình</span><strong>{Number(stats.avgRating || 0).toFixed(1)}</strong></article>
          <article className="dashboard-metric"><MessageSquareWarning size={20} /><span>Lượt đánh giá</span><strong>{stats.totalReviews || 0}</strong></article>
          <article className="dashboard-metric"><Users size={20} /><span>Lượt theo dõi</span><strong>{stats.totalFollows || 0}</strong></article>
          <article className="dashboard-metric"><FileText size={20} /><span>Tin nhắn</span><strong>{stats.totalMessages || 0}</strong></article>
        </div>
      </section>
    </div>
  );
}

function AdminUsers({ users, onRefresh }) {
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");

  const runAction = async (user, type) => {
    setBusyId(user.id);
    setNotice("");
    try {
      if (type === "verify") await apiAdmin.verifyUser(user.id);
      else await apiAdmin.toggleUser(user.id);
      await onRefresh();
      setNotice("Đã cập nhật tài khoản thành công.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusyId("");
    }
  };

  return (
    <div>
      <PageHeader
        description="Khóa/mở khóa tài khoản và cấp verified badge."
        eyebrow="USER MANAGEMENT"
        onRefresh={onRefresh}
        title="Quản lý người dùng"
      />
      {notice && <p className="inline-notice">{notice}</p>}
      <section className="dashboard-panel">
        <div className="responsive-table">
          <table>
            <thead><tr><th>Hội viên</th><th>Email</th><th>Vai trò</th><th>Sản phẩm</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name} {user.isVerified && <small className="table-badge">Verified</small>}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.postCount || 0}</td>
                  <td>{user.isActive ? "Hoạt động" : "Bị khóa"}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button disabled={busyId === user.id} onClick={() => runAction(user, "verify")} type="button">
                        {user.isVerified ? "Thu hồi badge" : "Cấp badge"}
                      </button>
                      <button
                        className={user.isActive ? "is-danger" : ""}
                        disabled={busyId === user.id || user.role === "Admin"}
                        onClick={() => runAction(user, "toggle")}
                        type="button"
                      >
                        {user.isActive ? "Khóa" : "Mở khóa"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length && <tr><td className="table-empty" colSpan="6">Chưa có người dùng.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AdminListings({ listings, onRefresh }) {
  const { confirm } = useConfirm();
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");

  const removeListing = async (listing) => {
    const ok = await confirm({
      title: "Xóa sản phẩm vi phạm?",
      message: `Bạn có chắc muốn xóa sản phẩm “${listing.name}”? Thao tác này không thể hoàn tác.`,
      confirmText: "Xóa sản phẩm",
      variant: "danger"
    });
    if (!ok) return;
    setBusyId(listing.id);
    try {
      await apiAdmin.deleteListing(listing.id);
      setNotice("Đã xóa sản phẩm vi phạm.");
      await onRefresh();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusyId("");
    }

  };

  return (
    <div>
      <PageHeader
        description="Xem và gỡ sản phẩm vi phạm khỏi marketplace."
        eyebrow="PRODUCT MODERATION"
        onRefresh={onRefresh}
        title="Quản lý sản phẩm"
      />
      {notice && <p className="inline-notice">{notice}</p>}
      <section className="dashboard-panel">
        <div className="responsive-table">
          <table>
            <thead><tr><th>Sản phẩm</th><th>Ngư dân</th><th>Loại</th><th>Giá</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id}>
                  <td>{listing.name}</td><td>{listing.sellerName}</td><td>{listing.type}</td>
                  <td>{Number(listing.price || 0).toLocaleString("vi-VN")}đ</td><td>{listing.status}</td>
                  <td><button className="button button--danger" disabled={busyId === listing.id} onClick={() => removeListing(listing)} type="button"><Trash2 size={15} /> Xóa</button></td>
                </tr>
              ))}
              {!listings.length && <tr><td className="table-empty" colSpan="6">Chưa có sản phẩm.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AdminLandingBatches({ batches, onRefresh }) {
  const { confirm } = useConfirm();
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");

  const remove = async (batch) => {
    const id = getLandingBatchId(batch);
    const ok = await confirm({
      title: "Ẩn vựa cá?",
      message: `Bạn có chắc muốn ẩn vựa cá “${batch.title}”? Các sản phẩm liên quan sẽ được giữ lại.`,
      confirmText: "Ẩn vựa cá",
      variant: "danger"
    });
    if (!ok) return;
    setBusyId(id);
    try {
      await apiLandingBatches.delete(id);
      setNotice("Đã ẩn vựa cá vi phạm.");
      await onRefresh();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusyId("");
    }
  };


  return (
    <div>
      <PageHeader
        description="Xem và ẩn vựa cá vi phạm mà không xóa sản phẩm liên quan."
        eyebrow="LANDING BATCH MODERATION"
        onRefresh={onRefresh}
        title="Quản lý vựa cá"
      />
      {notice && <p className="inline-notice">{notice}</p>}
      <section className="dashboard-panel">
        <div className="responsive-table">
          <table>
            <thead><tr><th>Vựa cá</th><th>Người bán</th><th>Sản phẩm</th><th>Cập bến</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={getLandingBatchId(batch)}>
                  <td>{batch.title}</td>
                  <td>{batch.sellerName}</td>
                  <td>{Number(batch.productCount || 0)}</td>
                  <td>{formatLandingDateTime(batch.landingTime || batch.createdAt)}</td>
                  <td>{batch.status}</td>
                  <td>
                    <button
                      className="button button--danger"
                      disabled={busyId === getLandingBatchId(batch) || batch.status === "Deleted"}
                      onClick={() => remove(batch)}
                      type="button"
                    >
                      <Trash2 size={15} /> Ẩn
                    </button>
                  </td>
                </tr>
              ))}
              {!batches.length && <tr><td className="table-empty" colSpan="6">Chưa có vựa cá.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AdminReports() {
  const [status, setStatus] = useState("Pending");
  const [reports, setReports] = useState([]);
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      setReports(unwrapRows(await apiReports.getAll({ status, limit: 100 })));
    } catch (error) {
      setNotice(error.message);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const handle = async (report, action) => {
    const note = window.prompt(
      action === "resolve" ? "Ghi chú xử lý (nội dung vi phạm sẽ bị xóa):" : "Lý do bỏ qua báo cáo:",
      "",
    );
    if (note === null) return;
    setBusyId(report.id);
    try {
      await apiReports.handle(report.id, action, note);
      setNotice(action === "resolve" ? "Đã xử lý và gỡ nội dung vi phạm." : "Đã bỏ qua báo cáo.");
      await load();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusyId("");
    }
  };

  const targetName = (report) =>
    report.productName || report.postName || report.recipeName || "Nội dung đã xóa";

  return (
    <div>
      <PageHeader
        description="Kiểm tra và cập nhật trạng thái các báo cáo vi phạm."
        eyebrow="SAFETY REPORTS"
        onRefresh={load}
        title="Xử lý báo cáo"
      />
      <div className="admin-filter-row">
        <label className="form-field"><span>Trạng thái</span><select onChange={(event) => setStatus(event.target.value)} value={status}><option value="Pending">Chờ xử lý</option><option value="Resolved">Đã xử lý</option><option value="Dismissed">Đã bỏ qua</option></select></label>
      </div>
      {notice && <p className="inline-notice">{notice}</p>}
      <section className="dashboard-panel">
        <div className="responsive-table">
          <table>
            <thead><tr><th>Nội dung</th><th>Loại</th><th>Người báo cáo</th><th>Lý do</th><th>Ngày gửi</th>{status === "Pending" && <th>Thao tác</th>}</tr></thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{targetName(report)}</td><td>{report.targetType}</td><td>{report.reporterName}</td>
                  <td>{report.reason}</td><td>{new Date(report.createdAt).toLocaleDateString("vi-VN")}</td>
                  {status === "Pending" && <td><div className="admin-row-actions"><button disabled={busyId === report.id} onClick={() => handle(report, "resolve")} type="button">Xử lý</button><button disabled={busyId === report.id} onClick={() => handle(report, "dismiss")} type="button">Bỏ qua</button></div></td>}
                </tr>
              ))}
              {!reports.length && <tr><td className="table-empty" colSpan={status === "Pending" ? 6 : 5}>Không có báo cáo ở trạng thái này.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [landingBatches, setLandingBatches] = useState([]);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setError("");
    const results = await Promise.allSettled([
      apiAdmin.getStats(),
      apiAdmin.getUsers({ limit: 100 }),
      apiAdmin.getListings({ limit: 100 }),
      apiReports.getAll({ status: "Pending", limit: 100 }),
      apiAdmin.getLandingBatches({ limit: 100 }),
    ]);
    if (results[0].status === "fulfilled") setStats(results[0].value);
    if (results[1].status === "fulfilled") setUsers(unwrapRows(results[1].value));
    if (results[2].status === "fulfilled") setListings(unwrapRows(results[2].value));
    if (results[3].status === "fulfilled") setPendingReports(unwrapRows(results[3].value));
    if (results[4].status === "fulfilled") setLandingBatches(unwrapRows(results[4].value));
    const rejected = results.find((result) => result.status === "rejected");
    if (rejected) setError(rejected.reason?.message || "Không thể tải đủ dữ liệu quản trị.");
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  return (
    <div className="workspace-page">
      {error && <p className="inline-notice inline-notice--warning">{error}</p>}
      <Routes>
        <Route index element={<AdminOverview onRefresh={loadDashboard} pendingReports={pendingReports} stats={stats} />} />
        <Route path="users" element={<AdminUsers onRefresh={loadDashboard} users={users} />} />
        <Route path="listings" element={<AdminListings listings={listings} onRefresh={loadDashboard} />} />
        <Route path="landing-batches" element={<AdminLandingBatches batches={landingBatches} onRefresh={loadDashboard} />} />
        <Route path="reports" element={<AdminReports />} />
      </Routes>
    </div>
  );
}
