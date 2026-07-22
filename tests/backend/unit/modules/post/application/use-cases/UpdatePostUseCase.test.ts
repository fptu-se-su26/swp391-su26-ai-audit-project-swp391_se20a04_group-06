import { UpdatePostUseCase } from "../../../../../../../backend/src/modules/post/application/use-cases/UpdatePostUseCase";
import { IPostRepository } from "../../../../../../../backend/src/modules/post/domain/repositories/IPostRepository";
import { Post } from "../../../../../../../backend/src/modules/post/domain/entities/Post";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../../../../../../backend/src/shared/domain/exceptions/DomainException";

describe("UpdatePostUseCase Unit Tests", () => {
  let mockPostRepository: jest.Mocked<IPostRepository>;
  let useCase: UpdatePostUseCase;

  beforeEach(() => {
    mockPostRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any;
    useCase = new UpdatePostUseCase(mockPostRepository);
  });

  it("should compile and load the module successfully", () => {
    expect(useCase).toBeDefined();
  });

  it("should fail if post does not exist", async () => {
    mockPostRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute("post123", "user1", "User", { title: "New Title" })
    ).rejects.toThrow(NotFoundError);
  });

  it("should fail if user is not author or admin", async () => {
    const mockPost = new Post({
      userId: "author123",
      userName: "Author",
      userAvatar: null,
      title: "Old Title",
      content: "Old Content",
      images: [],
      tags: [],
      likes: [],
      comments: [],
      viewCount: 0,
    });
    mockPostRepository.findById.mockResolvedValue(mockPost);

    await expect(
      useCase.execute("post123", "attacker123", "User", { title: "Hack Title" })
    ).rejects.toThrow(UnauthorizedError);
  });

  it("should fail if title is empty or too long", async () => {
    const mockPost = new Post({
      userId: "author123",
      userName: "Author",
      userAvatar: null,
      title: "Old Title",
      content: "Old Content",
      images: [],
      tags: [],
      likes: [],
      comments: [],
      viewCount: 0,
    });
    mockPostRepository.findById.mockResolvedValue(mockPost);

    await expect(
      useCase.execute("post123", "author123", "User", { title: "" })
    ).rejects.toThrow(ValidationError);

    await expect(
      useCase.execute("post123", "author123", "User", { title: "a".repeat(151) })
    ).rejects.toThrow(ValidationError);
  });

  it("should update post successfully when valid payload is passed", async () => {
    const mockPost = new Post({
      userId: "author123",
      userName: "Author",
      userAvatar: null,
      title: "Old Title",
      content: "Old Content",
      images: [],
      tags: [],
      likes: [],
      comments: [],
      viewCount: 0,
    });
    mockPostRepository.findById.mockResolvedValue(mockPost);

    const updated = await useCase.execute("post123", "author123", "User", {
      title: "New Valid Title",
      content: "New Valid Content",
    });

    expect(updated.title).toBe("New Valid Title");
    expect(updated.content).toBe("New Valid Content");
    expect(mockPostRepository.save).toHaveBeenCalledWith(mockPost);
  });
});
