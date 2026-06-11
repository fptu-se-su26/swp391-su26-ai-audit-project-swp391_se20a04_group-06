import { Router } from "express";
import {
  getPosts,
  getPostById,
  createPost,
  toggleLikePost,
  addComment,
  deletePost,
  deleteComment,
} from "../controllers/post.controller";
import { authenticate } from "../middlewares/auth";
import { validateSchema } from "../middlewares/validate";
import {
  createPostSchema,
  commentSchema,
} from "../validations/post.validation";

const router = Router();

router.get("/", getPosts);
router.get("/:id", getPostById);
router.post("/", authenticate, validateSchema(createPostSchema), createPost);
router.post("/:id/like", authenticate, toggleLikePost);
router.post(
  "/:id/comments",
  authenticate,
  validateSchema(commentSchema),
  addComment,
);
router.delete("/:id", authenticate, deletePost);
router.delete("/:postId/comments/:commentId", authenticate, deleteComment);

export default router;
