import { BoatLog } from "./BoatLog";

describe("Unit Test: BoatLog Domain Entity", () => {
  it("nên ném ra lỗi nếu nội dung nhật ký trống hoặc chỉ có khoảng trắng", () => {
    expect(() => {
      new BoatLog({
        userId: "user-1",
        userName: "Ngư dân A",
        userAvatar: null,
        content: "",
        images: [],
        likes: [],
      });
    }).toThrow("Nội dung nhật ký cabin không được trống.");

    expect(() => {
      new BoatLog({
        userId: "user-1",
        userName: "Ngư dân A",
        userAvatar: null,
        content: "   ",
        images: [],
        likes: [],
      });
    }).toThrow("Nội dung nhật ký cabin không được trống.");
  });

  it("nên thực hiện thay đổi trạng thái thích (Like/Unlike) chính xác", () => {
    const log = new BoatLog({
      userId: "user-owner",
      userName: "Ngư dân A",
      userAvatar: null,
      content: "Nhật ký chuyến ra khơi ngày hôm nay trúng đậm cá thu.",
      images: [],
      likes: [],
    });

    // Like lần đầu
    const firstLike = log.toggleLike("user-fan");
    expect(firstLike).toBe(true);
    expect(log.likes).toContain("user-fan");

    // Unlike (like lần thứ hai)
    const secondLike = log.toggleLike("user-fan");
    expect(secondLike).toBe(false);
    expect(log.likes).not.toContain("user-fan");
  });
});
