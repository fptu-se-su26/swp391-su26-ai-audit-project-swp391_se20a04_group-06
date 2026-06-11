import { Schema, model, Document, Types } from "mongoose";

export interface IRecipe extends Document {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  imageUrl: string | null;
  authorId: Types.ObjectId;
  difficulty: "Easy" | "Medium" | "Hard";
  cookingTime: number;
  servings: number;
  tags: string[];
  likes: Types.ObjectId[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const recipeSchema = new Schema<IRecipe>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    ingredients: [{ type: String }],
    instructions: [{ type: String }],
    imageUrl: { type: String, default: null },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    cookingTime: { type: Number, default: 30 },
    servings: { type: Number, default: 2 },
    tags: [{ type: String }],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

recipeSchema.index({ authorId: 1, createdAt: -1 });
recipeSchema.index({ title: "text", description: "text" });

export const Recipe = model<IRecipe>("Recipe", recipeSchema);
