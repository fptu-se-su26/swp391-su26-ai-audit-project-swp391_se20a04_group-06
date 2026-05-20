"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ─── routes/auth.routes.ts ───────────────────────────────────
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
router.get('/me', auth_1.authenticate, auth_controller_1.me);
exports.default = router;
