import { RowDataPacket } from 'mysql2';

/**
 * Điền đủ 7 ngày liên tiếp kể từ hôm nay, fill 0 cho ngày không có dữ liệu.
 * Pattern: Utility / Extract Function
 *
 * BEFORE: hàm này được định nghĩa inline bên trong getStats() của admin.controller.ts.
 * AFTER: tách ra đây để tái sử dụng và dễ test độc lập.
 */
export function fillDays(rows: RowDataPacket[]): { label: string; count: number }[] {
  const map: Record<string, number> = {};
  rows.forEach((r) => {
    const key = r.date?.toString().slice(0, 10);
    if (key) map[key] = r.count;
  });

  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      count: map[key] || 0,
    });
  }
  return result;
}
