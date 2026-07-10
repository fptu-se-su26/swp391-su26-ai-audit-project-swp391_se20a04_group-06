import { OmakaseSubscription } from "../models/OmakaseSubscription";
import { userRepository } from "../repositories/user.repository";
import { omakaseService } from "./omakase.service";

jest.mock("../models/OmakaseSubscription", () => ({
  OmakaseSubscription: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));
jest.mock("../repositories/user.repository");

describe("omakaseService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates or updates a Premium subscription", async () => {
    (userRepository.findRawById as jest.Mock).mockResolvedValue({
      _id: "user-1",
      isPremium: true,
      role: "User",
    });
    const subscription = {
      plan: "Weekly",
      deliveryAddress: "12 đường Biển",
      status: "Active",
    };
    (OmakaseSubscription.findOneAndUpdate as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(subscription),
    });

    await expect(
      omakaseService.subscribe("user-1", {
        plan: "Weekly",
        deliveryAddress: "<b>12 đường Biển</b>",
        phone: "0901234567",
      }),
    ).resolves.toEqual(subscription);
  });

  it("rejects non-Premium subscriptions", async () => {
    (userRepository.findRawById as jest.Mock).mockResolvedValue({
      _id: "user-1",
      isPremium: false,
      role: "User",
    });
    await expect(
      omakaseService.subscribe("user-1", {
        plan: "Monthly",
        deliveryAddress: "12 đường Biển, Đà Nẵng",
        phone: "0901234567",
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("cancels an active subscription", async () => {
    const subscription = { status: "Cancelled" };
    (OmakaseSubscription.findOneAndUpdate as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(subscription),
    });
    await expect(omakaseService.cancel("user-1")).resolves.toEqual(
      subscription,
    );
  });
});
