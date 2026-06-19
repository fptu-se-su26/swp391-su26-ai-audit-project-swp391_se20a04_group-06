"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPosts = getPosts;
exports.getPostById = getPostById;
exports.createPost = createPost;
exports.toggleLikePost = toggleLikePost;
exports.addComment = addComment;
exports.deletePost = deletePost;
exports.deleteComment = deleteComment;
const post_service_1 = require("../services/post.service");
const response_helper_1 = require("../helpers/response.helper");
async function getPosts(req, res) {
    try {
        const result = await post_service_1.postService.list(req.query);
        return res.json(result);
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function getPostById(req, res) {
    const id = (0, response_helper_1.parseId)(req.params.id);
    if (!id)
        return res.status(400).json({ message: "ID bài đăng không hợp lệ" });
    try {
        const post = await post_service_1.postService.getById(id);
        return res.json(post);
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function createPost(req, res) {
    const { userId } = req.user;
    try {
        const post = await post_service_1.postService.create(userId, req.body);
        return res.status(201).json({ message: "Đăng bài thành công", post });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function toggleLikePost(req, res) {
    const id = (0, response_helper_1.parseId)(req.params.id);
    const { userId } = req.user;
    if (!id)
        return res.status(400).json({ message: "ID bài đăng không hợp lệ" });
    try {
        const result = await post_service_1.postService.toggleLike(id, userId);
        return res.json(result);
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function addComment(req, res) {
    const id = (0, response_helper_1.parseId)(req.params.id);
    const { userId } = req.user;
    const { text } = req.body;
    if (!id)
        return res.status(400).json({ message: "ID bài đăng không hợp lệ" });
    try {
        const comments = await post_service_1.postService.addComment(id, userId, text);
        return res.json({ message: "Bình luận thành công", comments });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function deletePost(req, res) {
    const id = (0, response_helper_1.parseId)(req.params.id);
    const { userId, role } = req.user;
    if (!id)
        return res.status(400).json({ message: "ID bài đăng không hợp lệ" });
    try {
        await post_service_1.postService.delete(id, userId, role);
        return res.json({ message: "Xóa bài đăng thành công" });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function deleteComment(req, res) {
    const { postId, commentId } = req.params;
    const { userId, role } = req.user;
    const parsedPostId = (0, response_helper_1.parseId)(postId);
    if (!parsedPostId)
        return res.status(400).json({ message: "ID bài đăng không hợp lệ" });
    try {
        const comments = await post_service_1.postService.deleteComment(parsedPostId, commentId, userId, role);
        return res.json({ message: "Xóa bình luận thành công", comments });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
