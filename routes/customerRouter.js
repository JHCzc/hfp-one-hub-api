const express = require('express');
const { customerController } = require('../controller');
const router = express.Router();

router.post('/', customerController.addCustomer);
router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);
module.exports = router;