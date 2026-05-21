"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, auth_1.adminOnly); // tất cả route admin đều yêu cầu Admin
router.get('/stats', admin_controller_1.getStats);
router.get('/users', admin_controller_1.listUsers);
router.patch('/users/:id/toggle', admin_controller_1.toggleUser);
router.get('/listings', admin_controller_1.listAllProducts);
router.delete('/listings/:id', admin_controller_1.adminDeleteProduct);
exports.default = router;
