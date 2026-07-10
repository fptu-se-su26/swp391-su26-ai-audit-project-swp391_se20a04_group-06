import { useCallback, useEffect, useState } from "react";
import { Radio, Send } from "lucide-react";
import { apiAdmin } from "../../services/api";

export default function Broadcast() {
  const [form, setForm] = useState({ targetRole: "all", content: "" });
  const [history, setHistory] = useState([]);
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const data = await apiAdmin.getBroadcasts();
      setHistory(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      setNotice(error.message);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setNotice("");
    try {
      const result = await apiAdmin.broadcast(form);
      setNotice(`Đã gửi thông báo tới ${result.sentCount ?? 0} người dùng.`);
      setForm((current) => ({ ...current, content: "" }));
      await loadHistory();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="workspace-page">
      <header className="page-heading page-heading--compact">
        <div><span className="eyebrow">SYSTEM ANNOUNCEMENT</span><h1><Radio size={25} /> Broadcast Notification</h1><p>Gửi thông báo hệ thống tới đúng nhóm người dùng.</p></div>
      </header>
      {notice && <p className="inline-notice">{notice}</p>}
      <form className="dashboard-panel broadcast-form" onSubmit={submit}>
        <div className="form-grid">
          <label className="form-field"><span>Đối tượng</span><select onChange={update("targetRole")} value={form.targetRole}><option value="all">Tất cả người dùng</option><option value="Buyer">Người mua</option><option value="Seller">Ngư dân</option></select></label>
          <label className="form-field form-field--wide"><span>Nội dung ({form.content.length}/200)</span><textarea maxLength="200" onChange={update("content")} required rows="5" value={form.content} /></label>
        </div>
        <footer className="form-actions"><button className="button button--primary" disabled={sending} type="submit"><Send size={16} /> {sending ? "Đang gửi..." : "Gửi thông báo"}</button></footer>
      </form>
      <section className="dashboard-panel">
        <header><div><h2>Lịch sử broadcast</h2><p>Các thông báo được gửi gần đây.</p></div></header>
        <div className="responsive-table"><table><thead><tr><th>Nội dung</th><th>Đối tượng</th><th>Đã gửi</th><th>Thời gian</th></tr></thead><tbody>
          {history.map((item) => <tr key={item.id}><td>{item.content}</td><td>{item.targetRole}</td><td>{item.sentCount}</td><td>{new Date(item.createdAt).toLocaleString("vi-VN")}</td></tr>)}
          {!history.length && <tr><td className="table-empty" colSpan="4">Chưa có lịch sử gửi.</td></tr>}
        </tbody></table></div>
      </section>
    </div>
  );
}
