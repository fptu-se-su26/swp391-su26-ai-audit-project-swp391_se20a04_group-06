// Tệp lưu trữ ghi chú vá (patch notes) mô tả cấu trúc phần giao diện Tabs trên Dashboard dưới dạng chuỗi tĩnh
// Dùng làm tài liệu tham khảo cho cấu trúc UI của DashboardPage.jsx
export const DASHBOARD_TAB_SECTION = `
{/* Tabs - Khu vực chuyển đổi giữa các tab */}
<div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: \`1px solid \${C.border}\`, paddingBottom: 0 }}>
  {[
    // Danh sách tab với định dạng [khóa_tab, nhãn_hiển_thị]
    ['listings', '📋 Bài đăng của tôi'],
    ['inbox',    '💬 Tin nhắn'],
  ].map(([key, label]) => (
    <button
      key={key}
      onClick={() => setTab(key)} // Cập nhật state 'tab' khi người dùng click chọn
      style={{
        background: 'none',
        border: 'none',
        padding: '10px 18px',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: tab === key ? 800 : 500, // In đậm nếu tab đang được chọn
        color: tab === key ? C.ocean : C.muted, // Đổi màu chữ nếu tab đang hoạt động
        borderBottom: tab === key ? \`2px solid \${C.ocean}\` : '2px solid transparent', // Đường gạch chân dưới tab đang hoạt động
        marginBottom: -1,
        fontFamily: 'inherit',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  ))}
</div>

{/* Nội dung Tab 'listings' (Danh sách bài đăng của tôi) */}
{tab === 'listings' && (
  /* ... giữ nguyên toàn bộ listings JSX ... */
  <ListingsContent
    listings={listings} // Danh sách sản phẩm của ngư dân/người bán
    loading={loadingListings} // Trạng thái tải danh sách
    onDelete={deleteProduct} // Hàm xóa sản phẩm
    onEdit={(id, val) => { setEditId(id); setEditVal(val); }} // Hàm bắt đầu sửa cân nặng
    editId={editId} // ID sản phẩm đang sửa
    editVal={editVal} // Giá trị cân nặng mới nhập vào
    setEditVal={setEditVal} // Set state cân nặng mới nhập vào
    onSave={saveWeight} // Hàm lưu cân nặng sau khi sửa
    editLoading={editLoading} // Trạng thái đang lưu chỉnh sửa
    setPage={setPage} // Chuyển trang phân trang
    setSelectedProduct={setSelectedProduct} // Chọn sản phẩm để xem chi tiết
  />
)}

{/* Nội dung Tab 'inbox' (Giao diện nhắn tin/Hộp thư đến) */}
{tab === 'inbox' && <InboxTab user={user} />}
`;
