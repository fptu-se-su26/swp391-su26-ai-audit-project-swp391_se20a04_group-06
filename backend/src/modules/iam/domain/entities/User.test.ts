import { User } from "./User";
import { UserPremiumUpgradedEvent } from "../events/UserPremiumUpgradedEvent";

describe("IAM Module - User Aggregate Root", () => {
  it("nên kiểm tra trạng thái hoạt động chính xác", () => {
    const userActive = new User({
      name: "Ngư dân A",
      email: "fishermanA@gmail.com",
      passwordHash: "hash123",
      role: "User",
      isActive: true,
      isVerified: false,
      isPremium: false,
      avatar: null,
      badges: [],
      favorites: [],
      following: [],
    });

    const userInactive = new User({
      name: "Ngư dân B",
      email: "fishermanB@gmail.com",
      passwordHash: "hash123",
      role: "User",
      isActive: false,
      isVerified: false,
      isPremium: false,
      avatar: null,
      badges: [],
      favorites: [],
      following: [],
    });

    expect(() => userActive.checkActive()).not.toThrow();
    expect(() => userInactive.checkActive()).toThrow("Tài khoản đã bị khoá");
  });

  it("nên nâng cấp Premium và kích hoạt sự kiện UserPremiumUpgradedEvent", () => {
    const user = new User({
      name: "Ngư dân A",
      email: "fishermanA@gmail.com",
      passwordHash: "hash123",
      role: "User",
      isActive: true,
      isVerified: false,
      isPremium: false,
      avatar: null,
      badges: [],
      favorites: [],
      following: [],
    });

    expect(user.isPremium).toBe(false);
    expect(user.domainEvents.length).toBe(0);

    user.upgradeToPremium();

    expect(user.isPremium).toBe(true);
    expect(user.domainEvents.length).toBe(1);
    expect(user.domainEvents[0]).toBeInstanceOf(UserPremiumUpgradedEvent);
    expect(user.domainEvents[0].getAggregateId()).toBe(user.id);
  });

  it("nên cập nhật hồ sơ cá nhân và kiểm tra ràng buộc trống", () => {
    const user = new User({
      name: "Ngư dân A",
      email: "fishermanA@gmail.com",
      passwordHash: "hash123",
      role: "User",
      isActive: true,
      isVerified: false,
      isPremium: false,
      avatar: null,
      badges: [],
      favorites: [],
      following: [],
    });

    expect(() => user.updateProfile("   ")).toThrow("Tên không được bỏ trống");

    user.updateProfile("Tên Mới", "newemail@gmail.com", "http://avatar.url");
    expect(user.name).toBe("Tên Mới");
    expect(user.email).toBe("newemail@gmail.com");
    expect(user.avatar).toBe("http://avatar.url");
  });
});
