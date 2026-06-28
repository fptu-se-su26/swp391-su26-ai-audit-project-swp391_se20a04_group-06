import { useState } from "react";
import { Radio, Send } from "lucide-react";

export default function Broadcast() {
  const [form, setForm] = useState({ audience: "all", type: "info", title: "", message: "" });
  const [notice, setNotice] = useState("");

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    setNotice("Broadcast chưa được gửi vì backend hiện chưa cung cấp API tương ứng.");
  };

  return (
    <div className="workspace-page">
      <header className="page-heading page-heading--compact">
        <div><span className="eyebrow">SYSTEM ANNOUNCEMENT</span><h1><Radio size={25} /> Broadcast Notification</h1><p>Soạn thông báo hệ thống cho nhóm người dùng.</p></div>
      </header>
      {notice && <p className="inline-notice inline-notice--warning">{notice}</p>}
      <form className="dashboard-panel broadcast-form" onSubmit={submit}>
        <div className="form-grid">
          <label className="form-field"><span>Đối tượng</span><select onChange={update("audience")} value={form.audience}><option value="all">Tất cả người dùng</option><option value="buyers">Người mua</option><option value="sellers">Ngư dân</option><option value="premium">Premium</option></select></label>
          <label className="form-field"><span>Loại thông báo</span><select onChange={update("type")} value={form.type}><option value="info">Thông tin</option><option value="warning">Cảnh báo</option><option value="promo">Premium</option><option value="system">Hệ thống</option></select></label>
          <label className="form-field form-field--wide"><span>Tiêu đề</span><input onChange={update("title")} required value={form.title} /></label>
          <label className="form-field form-field--wide"><span>Nội dung</span><textarea onChange={update("message")} required rows="5" value={form.message} /></label>
        </div>
        <footer className="form-actions"><button className="button button--primary" type="submit"><Send size={16} /> Gửi thông báo</button></footer>
      </form>
    </div>
  );
}
