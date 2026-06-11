import { Schema, model, Document, Types } from "mongoose";

export interface IComment {
  userId: Types.ObjectId;
  userName: string;
  userAvatar: string | null;
  text: string;
  createdAt: Date;
}

export interface IPost extends Document {
  userId: Types.ObjectId;
  userName: string;
  userAvatar: string | null;
  title: string;
  content: string;
  images: string[];
  likes: Types.ObjectId[];
  comments: IComment[];
  tags: string[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: { type: String, required: true },
    userAvatar: { type: String, default: null },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    images: [{ type: String }],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        userName: { type: String, required: true },
        userAvatar: { type: String, default: null },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    tags: [{ type: String }],
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ title: "text", content: "text" });

export const Post = model<IPost>("Post", postSchema);
