import { BoatLog } from "../../domain/entities/BoatLog";
import { IBoatLogRepository } from "../../domain/repositories/IBoatLogRepository";
import { UpdateBoatLogUseCase } from "./UpdateBoatLogUseCase";

function createLog() {
  return new BoatLog(
    {
      userId: "owner-1",
      userName: "Ngư dân A",
      userAvatar: null,
      content: "Nội dung ban đầu",
      images: ["https://res.cloudinary.com/demo/image/upload/boat_logs/a.jpg"],
      likes: [],
    },
    "507f1f77bcf86cd799439011",
  );
}

function createRepository(log: BoatLog | null): jest.Mocked<IBoatLogRepository> {
  return {
    findById: jest.fn().mockResolvedValue(log),
    save: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  };
}

describe("UpdateBoatLogUseCase", () => {
  it("lưu nội dung và URL ảnh mới vào repository", async () => {
    const log = createLog();
    const repository = createRepository(log);
    const useCase = new UpdateBoatLogUseCase(repository);

    const result = await useCase.execute(
      log.id,
      "owner-1",
      "User",
      {
        content: "Nội dung đã cập nhật",
        images: [...log.images],
      },
    );

    expect(repository.save).toHaveBeenCalledWith(log);
    expect(result.content).toBe("Nội dung đã cập nhật");
    expect(result.images).toEqual(log.images);
  });

  it("không cho người khác sửa BoatLog", async () => {
    const repository = createRepository(createLog());
    const useCase = new UpdateBoatLogUseCase(repository);

    await expect(
      useCase.execute(
        "507f1f77bcf86cd799439011",
        "another-user",
        "User",
        { content: "Không hợp lệ", images: [] },
      ),
    ).rejects.toThrow("Bạn không có quyền sửa nhật ký này");

    expect(repository.save).not.toHaveBeenCalled();
  });

  it("không lưu nội dung trống", async () => {
    const repository = createRepository(createLog());
    const useCase = new UpdateBoatLogUseCase(repository);

    await expect(
      useCase.execute(
        "507f1f77bcf86cd799439011",
        "owner-1",
        "User",
        { content: "   ", images: [] },
      ),
    ).rejects.toThrow("Nội dung nhật ký cabin không được trống.");

    expect(repository.save).not.toHaveBeenCalled();
  });
});
