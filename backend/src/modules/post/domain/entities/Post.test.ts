import { Post } from "./Post";

describe("Unit Test: Post Domain Entity", () => {
  const defaultProps = {
    userId: "user-1",
    userName: "Tàu cá 01",
    userAvatar: null,
    title: "Kinh nghiệm tránh bão",
    content: "Nội dung chia sẻ kinh nghiệm tránh bão...",
    images: [],
    tags: ["bão", "ngư-nghiệp"],
    likes: [],
    comments: [],
    viewCount: 0,
  };

  it("nên ném ra lỗi nếu tiêu đề bài viết trống", () => {
    expect(() => {
      new Post({
        ...defaultProps,
        title: "",
      });
    }).toThrow("Tiêu đề bài viết không được trống.");
  });

  it("nên ném ra lỗi nếu nội dung bài viết trống", () => {
    expect(() => {
      new Post({
        ...defaultProps,
        content: "   ",
      });
    }).toThrow("Nội dung bài viết không được trống.");
  });

  it("nên thay đổi trạng thái thích chính xác", () => {
    const post = new Post(defaultProps);

    const liked = post.toggleLike("user-2");
    expect(liked).toBe(true);
    expect(post.likes).toContain("user-2");

    const unliked = post.toggleLike("user-2");
    expect(unliked).toBe(false);
    expect(post.likes).not.toContain("user-2");
  });

  it("nên thêm bình luận hợp lệ và từ chối bình luận trống", () => {
    const post = new Post(defaultProps);

    post.addComment("user-2", "Bạn cá", null, "Bài viết rất hay!");
    expect(post.comments.length).toBe(1);
    expect(post.comments[0].text).toBe("Bài viết rất hay!");

    expect(() => {
      post.addComment("user-2", "Bạn cá", null, "");
    }).toThrow("Nội dung bình luận không được trống.");
  });

  it("nên xóa bình luận của chính mình, của tác giả bài viết hoặc Admin, và từ chối người khác", () => {
    const post = new Post({
      ...defaultProps,
      comments: [
        {
          id: "comment-1",
          userId: "user-commenter",
          userName: "Người bình luận",
          userAvatar: null,
          text: "Bình luận dạo",
          createdAt: new Date(),
        },
      ],
    });

    // 1. Người lạ cố tình xóa -> throw error
    expect(() => {
      post.removeComment("comment-1", "user-stranger", "User");
    }).toThrow("Bạn không có quyền xóa bình luận này.");

    // 2. Chính tác giả bình luận xóa -> thành công
    post.removeComment("comment-1", "user-commenter", "User");
    expect(post.comments.length).toBe(0);

    // 3. Tác giả bài viết xóa bình luận của người khác -> thành công
    post.addComment("user-commenter", "Người bình luận", null, "Bình luận mới");
    const newCommentId = post.comments[0].id || "";
    // post.userId = "user-1" (defaultProps), ta dùng "user-1" để xóa comment của "user-commenter"
    post.removeComment(newCommentId, "user-1", "User");
    expect(post.comments.length).toBe(0);

    // 4. Admin xóa -> thành công
    post.addComment("user-commenter", "Người bình luận", null, "Bình luận 3");
    const comment3Id = post.comments[0].id || "";
    post.removeComment(comment3Id, "user-admin", "Admin");
    expect(post.comments.length).toBe(0);
  });
});
