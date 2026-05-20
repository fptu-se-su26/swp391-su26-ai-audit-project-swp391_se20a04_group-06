"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const image_controller_1 = require("../controllers/image.controller");
const auth_1 = require("../middlewares/auth");
const upload_1 = require("../middlewares/upload");
const router = (0, express_1.Router)();
// Upload tối đa 5 ảnh một lúc cho bài đăng :id
router.post('/products/:id/images', auth_1.authenticate, upload_1.upload.array('images', 5), image_controller_1.uploadImages);
// Xoá 1 ảnh
router.delete('/images/:id', auth_1.authenticate, image_controller_1.deleteImage);
exports.default = router;
