const express = require('express');
const customerRouter = require('./customerRouter');
const productRouter = require('./productRouter');
const emailRouter = require('./emailRouter');
const router = express.Router();
router.use('/customers', customerRouter);
router.use('/product', productRouter);
router.use('/email', emailRouter);
router.get('/', (req, res) => {
  res.send('Welcome to the API');
});
module.exports = router