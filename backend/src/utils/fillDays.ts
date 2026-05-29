export interface DayData {
  date?: string | Date;
  count: number;
}

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

    // TỐI ƯU HÓA: Định dạng ngày cục bộ theo múi giờ máy chủ hoạt động, tránh sai lệch từ toISOString()
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const dateVal = String(d.getDate()).padStart(2, "0");
    const key = `${year}-${month}-${dateVal}`;

    result.push({
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      count: map[key] || 0,
    });
  }
  return result;
}
