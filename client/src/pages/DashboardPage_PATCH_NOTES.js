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
