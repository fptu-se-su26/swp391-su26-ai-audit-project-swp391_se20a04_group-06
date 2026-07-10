import mongoose from "mongoose";
import { redis } from "../config/redis";
import { LandingBatch } from "../models/LandingBatch";
import { Product } from "../models/Product";
import { landingBatchService } from "./landingBatch.service";

jest.mock("../config/redis", () => ({
  redis: {
    incr: jest.fn().mockResolvedValue(1),
  },
}));

jest.mock("./notification.service", () => ({
  notifyFollowersNewLandingBatch: jest.fn().mockResolvedValue(undefined),
}));

describe("LandingBatch service", () => {
  const ownerId = new mongoose.Types.ObjectId();
  const otherUserId = new mongoose.Types.ObjectId();
  const batchId = new mongoose.Types.ObjectId();

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("từ chối thao tác quản lý của người không phải chủ vựa", async () => {
    const save = jest.fn();
    jest.spyOn(LandingBatch, "findById").mockResolvedValue({
      _id: batchId,
      sellerId: ownerId,
      status: "Active",
      save,
    } as any);

    await expect(
      landingBatchService.update(
        batchId.toString(),
        { userId: otherUserId.toString(), role: "User" },
        { title: "Tên vựa mới" },
      ),
    ).rejects.toEqual(
      expect.objectContaining({
        status: 403,
      }),
    );
    expect(save).not.toHaveBeenCalled();
  });

  it("cho phép Admin cập nhật trạng thái vựa cá", async () => {
    const batch = {
      _id: batchId,
      sellerId: ownerId,
      status: "Active",
      save: jest.fn().mockResolvedValue(undefined),
    };
    jest
      .spyOn(LandingBatch, "findById")
      .mockResolvedValue(batch as any);

    await expect(
      landingBatchService.update(
        batchId.toString(),
        { userId: otherUserId.toString(), role: "Admin" },
        { status: "Closed" },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        message: expect.any(String),
      }),
    );
    expect(batch.status).toBe("Closed");
    expect(batch.save).toHaveBeenCalledTimes(1);
  });

  it("soft delete giữ bản ghi và chỉ chuyển trạng thái sang Deleted", async () => {
    const batch = {
      _id: batchId,
      sellerId: ownerId,
      status: "Active",
      save: jest.fn().mockResolvedValue(undefined),
    };
    jest
      .spyOn(LandingBatch, "findById")
      .mockResolvedValue(batch as any);

    await landingBatchService.softDelete(batchId.toString(), {
      userId: ownerId.toString(),
      role: "User",
    });

    expect(batch.status).toBe("Deleted");
    expect(batch.save).toHaveBeenCalledTimes(1);
  });

  it("gắn batchId, sellerId và kế thừa dữ liệu chung khi thêm sản phẩm", async () => {
    const location = {
      type: "Point" as const,
      coordinates: [106.7, 10.77] as [number, number],
    };
    const batch = {
      _id: batchId,
      sellerId: ownerId,
      status: "Active",
      origin: "Biển Đông",
      catchArea: "Khu vực đánh bắt",
      catchTime: new Date("2026-07-01T01:00:00.000Z"),
      location,
      images: ["https://example.com/batch.jpg"],
      notificationSentAt: new Date(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    jest
      .spyOn(LandingBatch, "findById")
      .mockResolvedValue(batch as any);
    jest.spyOn(Product, "insertMany").mockResolvedValue([
      { _id: new mongoose.Types.ObjectId() },
    ] as any);
    jest
      .spyOn(LandingBatch, "updateOne")
      .mockResolvedValue({ acknowledged: true } as any);

    await landingBatchService.addProducts(
      batchId.toString(),
      { userId: ownerId.toString(), role: "User" },
      [
        {
          name: "Sản phẩm kiểm thử",
          category: "Fish",
          type: "Fresh",
          price: 100000,
          totalWeight: 10,
          remainingWeight: 8,
          images: [],
        },
      ],
    );

    expect(Product.insertMany).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          batchId,
          sellerId: ownerId,
          origin: "Biển Đông",
          location,
          images: ["https://example.com/batch.jpg"],
        }),
      ],
      { ordered: true },
    );
    expect(redis.incr).toHaveBeenCalledWith("product:list:version:Fresh");
  });
});
