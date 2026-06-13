import { AggregateRoot } from "../../../../shared/domain/AggregateRoot";
import { ValidationError } from "../../../../shared/domain/exceptions/DomainException";

export interface RecipeProps {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  imageUrl: string | null;
  authorId: string;
  difficulty: "Easy" | "Medium" | "Hard";
  cookingTime: number;
  servings: number;
  tags: string[];
  likes: string[];
  viewCount: number;
}

export class Recipe extends AggregateRoot<RecipeProps> {
  constructor(props: RecipeProps, id?: string) {
    super(props, id);
    this.validate();
  }

  private validate(): void {
    if (!this.props.title || this.props.title.trim() === "") {
      throw new ValidationError("Tiêu đề không được trống.");
    }
  }

  public toggleLike(userId: string): boolean {
    const index = this.props.likes.indexOf(userId);
    if (index === -1) {
      this.props.likes.push(userId);
      return true;
    } else {
      this.props.likes.splice(index, 1);
      return false;
    }
  }

  public incrementViews(): void {
    this.props.viewCount += 1;
  }

  public update(data: Partial<RecipeProps>): void {
    if (data.title !== undefined) this.props.title = data.title;
    if (data.description !== undefined) this.props.description = data.description;
    if (data.ingredients !== undefined) this.props.ingredients = data.ingredients;
    if (data.instructions !== undefined) this.props.instructions = data.instructions;
    if (data.imageUrl !== undefined) this.props.imageUrl = data.imageUrl;
    if (data.difficulty !== undefined) this.props.difficulty = data.difficulty;
    if (data.cookingTime !== undefined) this.props.cookingTime = data.cookingTime;
    if (data.servings !== undefined) this.props.servings = data.servings;
    if (data.tags !== undefined) this.props.tags = data.tags;
    this.validate();
  }

  public toProps(): RecipeProps & { id: string } {
    return {
      id: this.id,
      title: this.props.title,
      description: this.props.description,
      ingredients: this.props.ingredients,
      instructions: this.props.instructions,
      imageUrl: this.props.imageUrl,
      authorId: this.props.authorId,
      difficulty: this.props.difficulty,
      cookingTime: this.props.cookingTime,
      servings: this.props.servings,
      tags: this.props.tags,
      likes: this.props.likes,
      viewCount: this.props.viewCount,
    };
  }

  get title() { return this.props.title; }
  get authorId() { return this.props.authorId; }
  get likes() { return this.props.likes; }
}
