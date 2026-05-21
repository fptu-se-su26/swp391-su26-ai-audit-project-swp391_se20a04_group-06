"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const follow_controller_1 = require("../controllers/follow.controller");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.post('/:sellerId/toggle', auth_1.authenticate, follow_controller_1.toggleFollow);
router.get('/:sellerId/check', auth_1.authenticate, follow_controller_1.checkFollow);
exports.default = router;
