import { AggregateRoot } from "../../../../shared/domain/AggregateRoot";
import { ValidationError } from "../../../../shared/domain/exceptions/DomainException";

export interface BoatLogProps {
  userId: string;
  userName: string;
  userAvatar: string | null;
  content: string;
  images: string[];
  likes: string[];
}

export class BoatLog extends AggregateRoot<BoatLogProps> {
  constructor(props: BoatLogProps, id?: string) {
    super(props, id);
    this.validate();
  }

  private validate(): void {
    if (!this.props.content || this.props.content.trim() === "") {
      throw new ValidationError("Nội dung nhật ký cabin không được trống.");
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

  public toProps(): BoatLogProps & { id: string } {
    return {
      id: this.id,
      userId: this.props.userId,
      userName: this.props.userName,
      userAvatar: this.props.userAvatar,
      content: this.props.content,
      images: this.props.images,
      likes: this.props.likes,
    };
  }

  get userId() { return this.props.userId; }
  get likes() { return this.props.likes; }
}
