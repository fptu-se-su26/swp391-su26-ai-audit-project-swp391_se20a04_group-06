"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/', product_controller_1.getProducts); // Public — có thể lọc GPS
router.get('/my', auth_1.authenticate, product_controller_1.getMyProducts); // Dashboard seller
router.get('/:id', product_controller_1.getProductById); // Public
router.post('/', auth_1.authenticate, product_controller_1.createProduct);
router.put('/:id', auth_1.authenticate, product_controller_1.updateProduct);
router.delete('/:id', auth_1.authenticate, product_controller_1.deleteProduct);
exports.default = router;
