"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const redis_1 = require("../../../../backend/src/config/redis");
const LandingBatch_1 = require("../../../../backend/src/models/LandingBatch");
const Product_1 = require("../../../../backend/src/models/Product");
const landingBatch_service_1 = require("../../../../backend/src/services/landingBatch.service");
jest.mock("../../../../backend/src/config/redis", () => ({
    redis: {
        incr: jest.fn().mockResolvedValue(1),
    },
}));
jest.mock("../../../../backend/src/services/notification.service", () => ({
    notifyFollowersNewLandingBatch: jest.fn().mockResolvedValue(undefined),
}));
describe("LandingBatch service", () => {
    const ownerId = new mongoose_1.default.Types.ObjectId();
    const otherUserId = new mongoose_1.default.Types.ObjectId();
    const batchId = new mongoose_1.default.Types.ObjectId();
    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });
    it("từ chối thao tác quản lý của người không phải chủ vựa", async () => {
        const save = jest.fn();
        jest.spyOn(LandingBatch_1.LandingBatch, "findById").mockResolvedValue({
            _id: batchId,
            sellerId: ownerId,
            status: "Active",
            save,
        });
        await expect(landingBatch_service_1.landingBatchService.update(batchId.toString(), { userId: otherUserId.toString(), role: "User" }, { title: "Tên vựa mới" })).rejects.toEqual(expect.objectContaining({
            status: 403,
        }));
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
            .spyOn(LandingBatch_1.LandingBatch, "findById")
            .mockResolvedValue(batch);
        await expect(landingBatch_service_1.landingBatchService.update(batchId.toString(), { userId: otherUserId.toString(), role: "Admin" }, { status: "Closed" })).resolves.toEqual(expect.objectContaining({
            message: expect.any(String),
        }));
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
            .spyOn(LandingBatch_1.LandingBatch, "findById")
            .mockResolvedValue(batch);
        await landingBatch_service_1.landingBatchService.softDelete(batchId.toString(), {
            userId: ownerId.toString(),
            role: "User",
        });
        expect(batch.status).toBe("Deleted");
        expect(batch.save).toHaveBeenCalledTimes(1);
    });
    it("gắn batchId, sellerId và kế thừa dữ liệu chung khi thêm sản phẩm", async () => {
        const location = {
            type: "Point",
            coordinates: [106.7, 10.77],
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
            .spyOn(LandingBatch_1.LandingBatch, "findById")
            .mockResolvedValue(batch);
        jest.spyOn(Product_1.Product, "insertMany").mockResolvedValue([
            { _id: new mongoose_1.default.Types.ObjectId() },
        ]);
        jest
            .spyOn(LandingBatch_1.LandingBatch, "updateOne")
            .mockResolvedValue({ acknowledged: true });
        await landingBatch_service_1.landingBatchService.addProducts(batchId.toString(), { userId: ownerId.toString(), role: "User" }, [
            {
                name: "Sản phẩm kiểm thử",
                category: "Fish",
                type: "Fresh",
                price: 100000,
                totalWeight: 10,
                remainingWeight: 8,
                images: [],
            },
        ]);
        expect(Product_1.Product.insertMany).toHaveBeenCalledWith([
            expect.objectContaining({
                batchId,
                sellerId: ownerId,
                origin: "Biển Đông",
                location,
                images: ["https://example.com/batch.jpg"],
            }),
        ], { ordered: true });
        expect(redis_1.redis.incr).toHaveBeenCalledWith("product:list:version:Fresh");
    });
});
