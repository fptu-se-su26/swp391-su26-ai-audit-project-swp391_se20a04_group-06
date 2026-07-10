import { useEffect, useState } from "react";
import { Camera, Save, ShieldCheck, Trash2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiAuth } from "../services/api";

export default function Profile() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "" });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setForm({ name: user?.name || "", email: user?.email || "" });
    setPreview(user?.avatar || user?.avatarUrl || "");
  }, [user]);

  const selectAvatar = (event) => {
    const file = event.target.files?.[0] || null;
    setAvatar(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("email", form.email);
      if (avatar) data.append("avatar", avatar);
      await apiAuth.updateProfile(data);
      const profile = await apiAuth.getProfile();
      login(profile);
      setAvatar(null);
      setNotice("Đã cập nhật hồ sơ.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };

  const removeAccount = async () => {
    const confirmation = window.prompt('Nhập "XOA TAI KHOAN" để xác nhận xóa vĩnh viễn dữ liệu:');
    if (confirmation !== "XOA TAI KHOAN") return;
    setBusy(true);
    try {
      await apiAuth.deleteAccount();
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      setNotice(error.message);
      setBusy(false);
    }
  };

  return (
    <div className="page-container">
      <header className="page-heading">
        <div>
          <span className="eyebrow">ACCOUNT</span>
          <h1><User size={25} /> Hồ sơ cá nhân</h1>
          <p>Cập nhật thông tin tài khoản và ảnh đại diện.</p>
        </div>
      </header>
      {notice && <p className="inline-notice">{notice}</p>}
      <section className="dashboard-panel profile-editor">
        <div className="profile-avatar-editor">
          {preview ? <img alt={user?.name} src={preview} /> : <span>{(user?.name || "U").slice(0, 2).toUpperCase()}</span>}
          <label><Camera size={16} /> Đổi ảnh<input accept="image/jpeg,image/png,image/webp" hidden onChange={selectAvatar} type="file" /></label>
          <p>{user?.role} {user?.isVerified && <small className="table-badge"><ShieldCheck size={12} /> Verified</small>}</p>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <label className="form-field"><span>Họ tên</span><input minLength="2" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required value={form.name} /></label>
          <label className="form-field"><span>Email</span><input onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required type="email" value={form.email} /></label>
          <footer className="form-actions form-field--wide"><button className="button button--primary" disabled={busy} type="submit"><Save size={16} /> Lưu thay đổi</button></footer>
        </form>
      </section>
      <section className="dashboard-panel danger-zone">
        <div><h2>Xóa tài khoản</h2><p className="muted-copy">Xóa vĩnh viễn tài khoản và dữ liệu liên quan theo FR-07. Thao tác không thể hoàn tác.</p></div>
        <button className="button button--danger" disabled={busy} onClick={removeAccount} type="button"><Trash2 size={16} /> Xóa tài khoản</button>
      </section>
    </div>
  );
}
