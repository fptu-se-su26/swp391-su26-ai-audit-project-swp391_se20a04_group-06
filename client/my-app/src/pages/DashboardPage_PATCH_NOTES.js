/**
 * PATCH cho DashboardPage.jsx
 *
 * Thêm tab "💬 Tin nhắn" với InboxTab component.
 *
 * Các thay đổi cần làm trong DashboardPage.jsx hiện tại:
 *
 * 1. THÊM import:
 *    import { InboxTab } from '../components/InboxTab';
 *
 * 2. XÓA state `unread` riêng trong DashboardPage (đã có ở App.jsx rồi)
 *    Dòng cần xóa: const [unread, setUnread] = useState(0);
 *    và: api('/messages/unread-count').then((data) => setUnread(data.count)).catch(() => {});
 *
 * 3. THAY ĐỔI phần tab buttons:
 *    Tìm dòng có tabs (listings / messages / ...) và thêm tab mới.
 *
 * ─── DIFF dạng readable ───
 *
 * THAY: tab buttons cũ (chỉ có "listings" và số unread)
 *
 *   <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
 *     <button ... onClick={() => setTab('listings')}>📋 Bài đăng</button>
 *     <button ... onClick={() => setTab('messages')}>
 *       💬 Tin nhắn {unread > 0 && <span ...>{unread}</span>}
 *     </button>
 *   </div>
 *
 * THÀNH: dùng InboxTab component trong content
 *
 *   <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
 *     <TabBtn active={tab === 'listings'} onClick={() => setTab('listings')}>📋 Bài đăng</TabBtn>
 *     <TabBtn active={tab === 'inbox'} onClick={() => setTab('inbox')}>💬 Tin nhắn</TabBtn>
 *   </div>
 *
 *   {tab === 'inbox' && <InboxTab user={user} />}
 *
 * ─── Full minimal DashboardPage stub để reference ───
 * (Chỉ thay đổi phần tab. Giữ nguyên toàn bộ listings logic.)
 */

// Đây là đoạn code cần THÊM VÀO đầu DashboardPage.jsx
// import { InboxTab } from '../components/InboxTab';

// Đây là đoạn tab buttons mới (thay tab section cũ trong return):
export const DASHBOARD_TAB_SECTION = `
{/* Tabs */}
<div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: \`1px solid \${C.border}\`, paddingBottom: 0 }}>
  {[
    ['listings', '📋 Bài đăng của tôi'],
    ['inbox',    '💬 Tin nhắn'],
  ].map(([key, label]) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      style={{
        background: 'none',
        border: 'none',
        padding: '10px 18px',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: tab === key ? 800 : 500,
        color: tab === key ? C.ocean : C.muted,
        borderBottom: tab === key ? \`2px solid \${C.ocean}\` : '2px solid transparent',
        marginBottom: -1,
        fontFamily: 'inherit',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  ))}
</div>

{tab === 'listings' && (
  /* ... giữ nguyên toàn bộ listings JSX ... */
  <ListingsContent
    listings={listings}
    loading={loadingListings}
    onDelete={deleteProduct}
    onEdit={(id, val) => { setEditId(id); setEditVal(val); }}
    editId={editId}
    editVal={editVal}
    setEditVal={setEditVal}
    onSave={saveWeight}
    editLoading={editLoading}
    setPage={setPage}
    setSelectedProduct={setSelectedProduct}
  />
)}

{tab === 'inbox' && <InboxTab user={user} />}
`;

// Ghi chú: Xem file DashboardPage_full.jsx để có bản hoàn chỉnh
