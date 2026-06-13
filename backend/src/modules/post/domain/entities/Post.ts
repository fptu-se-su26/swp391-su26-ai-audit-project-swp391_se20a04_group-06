import crypto from "crypto";
import { AggregateRoot } from "../../../../shared/domain/AggregateRoot";
import { ValidationError } from "../../../../shared/domain/exceptions/DomainException";

export interface CommentProps {
  id?: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  text: string;
  createdAt?: Date;
}

export interface PostProps {
  userId: string;
  userName: string;
  userAvatar: string | null;
  title: string;
  content: string;
  images: string[];
  tags: string[];
  likes: string[];
  comments: CommentProps[];
  viewCount: number;
  createdAt?: Date;
}

export class Post extends AggregateRoot<PostProps> {
  constructor(props: PostProps, id?: string) {
    super(props, id);
    this.validate();
  }

  private validate(): void {
    if (!this.props.title || this.props.title.trim() === "") {
      throw new ValidationError("Tiêu đề bài viết không được trống.");
    }
    if (!this.props.content || this.props.content.trim() === "") {
      throw new ValidationError("Nội dung bài viết không được trống.");
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

  public addComment(userId: string, userName: string, userAvatar: string | null, text: string): void {
    if (!text || text.trim() === "") {
      throw new ValidationError("Nội dung bình luận không được trống.");
    }
    this.props.comments.push({
      id: crypto.randomUUID(),
      userId,
      userName,
      userAvatar,
      text: text.trim(),
      createdAt: new Date(),
    });
  }

  public removeComment(commentId: string, userId: string, role: string): void {
    const index = this.props.comments.findIndex((c) => c.id === commentId);
    if (index === -1) {
      throw new ValidationError("Không tìm thấy bình luận.");
    }
    const comment = this.props.comments[index];
    if (role !== "Admin" && comment.userId !== userId && this.props.userId !== userId) {
      throw new ValidationError("Bạn không có quyền xóa bình luận này.");
    }
    this.props.comments.splice(index, 1);
  }

  public toProps(): PostProps & { id: string } {
    return {
      id: this.id,
      userId: this.props.userId,
      userName: this.props.userName,
      userAvatar: this.props.userAvatar,
      title: this.props.title,
      content: this.props.content,
      images: this.props.images,
      tags: this.props.tags,
      likes: this.props.likes,
      comments: this.props.comments,
      viewCount: this.props.viewCount,
      createdAt: this.props.createdAt,
    };
  }

  get userId() { return this.props.userId; }
  get likes() { return this.props.likes; }
  get comments() { return this.props.comments; }
}
