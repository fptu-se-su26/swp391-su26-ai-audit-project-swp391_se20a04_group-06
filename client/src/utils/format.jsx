import React from 'react';
import { C } from './theme';
export const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n) + "đ";
export const pill = (bg, color, label) => (
  <span
    style={{
      background: bg,
      color,
      borderRadius: 4,
      padding: "2px 7px",
      fontSize: 11,
      fontWeight: 700,
    }}
  >
    {label}
  </span>
);
