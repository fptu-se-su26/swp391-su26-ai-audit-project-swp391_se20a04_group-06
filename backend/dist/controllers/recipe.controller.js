"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecipes = getRecipes;
exports.getRecipeById = getRecipeById;
exports.createRecipe = createRecipe;
exports.toggleLikeRecipe = toggleLikeRecipe;
exports.updateRecipe = updateRecipe;
exports.deleteRecipe = deleteRecipe;
const recipe_service_1 = require("../services/recipe.service");
const response_helper_1 = require("../helpers/response.helper");
async function getRecipes(req, res) {
    try {
        const result = await recipe_service_1.recipeService.list(req.query);
        return res.json(result);
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function getRecipeById(req, res) {
    const id = (0, response_helper_1.parseId)(req.params.id);
    if (!id)
        return res.status(400).json({ message: "ID công thức không hợp lệ" });
    try {
        const recipe = await recipe_service_1.recipeService.getById(id);
        return res.json(recipe);
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function createRecipe(req, res) {
    const { userId, role } = req.user;
    try {
        const recipe = await recipe_service_1.recipeService.create(userId, role, req.body);
        return res
            .status(201)
            .json({ message: "Tạo công thức thành công", recipe });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function toggleLikeRecipe(req, res) {
    const id = (0, response_helper_1.parseId)(req.params.id);
    const { userId } = req.user;
    if (!id)
        return res.status(400).json({ message: "ID công thức không hợp lệ" });
    try {
        const result = await recipe_service_1.recipeService.toggleLike(id, userId);
        return res.json(result);
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function updateRecipe(req, res) {
    const id = (0, response_helper_1.parseId)(req.params.id);
    const { userId, role } = req.user;
    if (!id)
        return res.status(400).json({ message: "ID công thức không hợp lệ" });
    try {
        const recipe = await recipe_service_1.recipeService.update(id, userId, role, req.body);
        return res.json({ message: "Cập nhật công thức thành công", recipe });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
async function deleteRecipe(req, res) {
    const id = (0, response_helper_1.parseId)(req.params.id);
    const { userId, role } = req.user;
    if (!id)
        return res.status(400).json({ message: "ID công thức không hợp lệ" });
    try {
        await recipe_service_1.recipeService.delete(id, userId, role);
        return res.json({ message: "Xóa công thức thành công" });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
