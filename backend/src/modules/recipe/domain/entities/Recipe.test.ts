import { Recipe } from "./Recipe";

describe("Recipe Aggregate Root", () => {
  it("nên ném ra lỗi nếu tiêu đề trống", () => {
    expect(() => {
      new Recipe({
        title: "",
        description: "Mô tả",
        ingredients: [],
        instructions: [],
        imageUrl: null,
        authorId: "author-1",
        difficulty: "Medium",
        cookingTime: 30,
        servings: 2,
        tags: [],
        likes: [],
        viewCount: 0,
      });
    }).toThrow("Tiêu đề không được trống.");
  });

  it("nên thay đổi trạng thái like chính xác", () => {
    const recipe = new Recipe({
      title: "Gỏi Sứa",
      description: "Mô tả",
      ingredients: [],
      instructions: [],
      imageUrl: null,
      authorId: "author-1",
      difficulty: "Medium",
      cookingTime: 30,
      servings: 2,
      tags: [],
      likes: [],
      viewCount: 0,
    });

    const liked = recipe.toggleLike("user-1");
    expect(liked).toBe(true);
    expect(recipe.likes).toContain("user-1");

    const unliked = recipe.toggleLike("user-1");
    expect(unliked).toBe(false);
    expect(recipe.likes).not.toContain("user-1");
  });
});
