const express = require('express');
const { productController } = require('../controller');
const router = express.Router();

router.post('/', productController.addProduct);
router.get('/', productController.getProducts);
router.get('/:product_id', productController.getProductById);
router.put('/:product_id', productController.updateProduct);
router.delete('/:product_id', productController.deleteProduct);
router.get('/customer/:customer_id', productController.getProductsByCustomerId);
module.exports = router;