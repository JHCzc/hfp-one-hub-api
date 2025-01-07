const { sql, poolPromise } = require("../db");

const addProduct = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("product_name", sql.NVarChar(100), req.body.product_name)
      .input("product_code", sql.NVarChar(50), req.body.product_code)
      .input("customer_id", sql.Int, req.body.customer_id)
      .input("sku", sql.NVarChar(50), req.body.sku)
      .input("description", sql.NVarChar(255), req.body.description)
      .query(
        `INSERT INTO Product (product_name, product_code, customer_id,sku, description) 
             OUTPUT INSERTED.* VALUES (@product_name, @product_code, @customer_id, @sku, @description)`
      );
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500);
    res.send(err.message);
    next(err);
  }
};
const getProducts = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Product");
    res.json(result.recordset);
  } catch (err) {
    res.status(500);
    res.send(err.message);
    next(err);
  }
};
// ...existing code...

const getProductsByCustomerId = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("customer_id", sql.Int, req.params.customer_id)
      .query("SELECT * FROM Product WHERE customer_id = @customer_id");
    if (result.recordset.length === 0) {
      res.status(404);
      res.send("No products found for this customer");
    } else {
      res.json(result.recordset);
    }
  } catch (err) {
    res.status(500);
    res.send(err.message);
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("product_id", sql.Int, req.params.product_id)
      .query("SELECT * FROM Product WHERE product_id = @product_id");
    if (result.recordset.length === 0) {
      res.status(404);
      res.send("Product not found");
    } else {
      res.json(result.recordset[0]);
    }
  } catch (err) {
    res.status(500);
    res.send(err.message);
    next(err);
  }
};
const updateProduct = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("product_id", sql.Int, req.params.product_id)
      .input("product_name", sql.NVarChar, req.body.name)
      .input("product_code", sql.NVarChar, req.body.product_code)
      .input("customer_id", sql.Int, req.body.customer_id)
      .input("sku", sql.Int, req.body.sku)
      .input("description", sql.Int, req.body.description)
      .query(
        `UPDATE Product SET product_name = @product_name, product_code = @product_code, customer_id = @customer_id WHERE product_id = @product_id, sku = @sku, description = @description`
      );
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500);
    res.send(err.message);
    next(err);
  }
};
const deleteProduct = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("product_id", sql.Int, req.params.product_id)
      .query("DELETE FROM Product WHERE product_id = @product_id");
    if (result.rowsAffected[0] === 0) {
      res.status(404);
      res.send("Product not found");
    } else {
      res.json({ product_id: req.params.product_id });
    }
  } catch (err) {
    res.status(500);
    res.send(err.message);
    next(err);
  }
};

module.exports = {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByCustomerId,
};
