export interface DayData {
  date?: string | Date;
  count: number;
}

/**
 * Điền đủ 7 ngày liên tiếp kể từ hôm nay, điền 0 cho ngày không có dữ liệu.
 */
export function fillDays(rows: DayData[]): { label: string; count: number }[] {
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
