import React, { useState } from 'react';
import { C } from '../utils/theme';

/**
 * Component chuông thông báo với dropdown.
 * Tách ra khỏi Navbar để mỗi component chỉ làm một việc.
 */
export function NotificationBell({ notifs, unreadCount, onMarkRead, onNotifClick }) {
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) onMarkRead();
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleToggle}
        style={{
          background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none',
          borderRadius: '50%', width: 36, height: 36, cursor: 'pointer',
          fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="Thông báo"
      >
        🔔
      </button>

      {unreadCount > 0 && (
        <Badge count={unreadCount} />
      )}

      {open && (
        <NotifDropdown notifs={notifs} unreadCount={unreadCount} onNotifClick={(n) => { setOpen(false); onNotifClick(n); }} />
      )}
    </div>
  );
}

function Badge({ count }) {
  return (
    <div style={{
      position: 'absolute', top: -4, right: -4,
      background: '#EF4444', color: '#fff', borderRadius: '50%',
      width: 20, height: 20, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: 11, fontWeight: 700,
    }}>
      {count}
    </div>
  );
}

function NotifDropdown({ notifs, unreadCount, onNotifClick }) {
  return (
    <div style={{
      position: 'absolute', top: 46, right: 0, width: 320,
      background: '#fff', borderRadius: 14,
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
      overflow: 'hidden', border: `1px solid ${C.border}`,
    }}>
      <div style={{
        padding: '14px 18px', background: C.ocean, color: '#fff',
        fontWeight: 700, fontSize: 14, display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>Thông báo của bạn</span>
        {unreadCount > 0 && (
          <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 20 }}>
            {unreadCount} mới
          </span>
        )}
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {notifs.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: C.muted, fontSize: 13 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔔</div>
            Không có thông báo nào
          </div>
        ) : (
          notifs.map((n, i) => (
            <NotifItem key={n.id || i} notif={n} onClick={() => onNotifClick(n)} />
          ))
        )}
      </div>
    </div>
  );
}

function NotifItem({ notif: n, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '14px 18px', borderBottom: `1px solid ${C.border}`,
        fontSize: 13, color: C.dark,
        background: n.isRead ? '#fff' : 'rgba(11,79,108,0.04)',
        display: 'flex', gap: 10, alignItems: 'flex-start',
        cursor: n.productId ? 'pointer' : 'default',
      }}
    >
      <span style={{ fontSize: 16, marginTop: 1 }}>
        {n.type === 'new_review' ? '⭐' : '📢'}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ lineHeight: 1.5, fontWeight: n.isRead ? 400 : 600 }}>
          {n.preview || n.content}
        </div>
        {n.createdAt && (
          <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
            🕒 {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {new Date(n.createdAt).toLocaleDateString()}
          </div>
        )}
      </div>
      {!n.isRead && (
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.ocean, flexShrink: 0, marginTop: 6 }} />
      )}
    </div>
  );
}
