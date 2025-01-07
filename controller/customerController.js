const { sql, poolPromise } = require("../db");

const addCustomer = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("customer_name", sql.NVarChar, req.body.customer_name)
      .input("email", sql.NVarChar, req.body.email)
      .input("phone_number", sql.NVarChar, req.body.phone)
      .input("contract_number", sql.NVarChar, req.body.contract_number)
      .input("supplier_number", sql.NVarChar, req.body.supplier_number)
      .query(
        `INSERT INTO Customer (customer_name, email, phone_number, contract_number, supplier_number) 
            OUTPUT INSERTED.* VALUES (@customer_name, @email, @phone_number,@contract_number, @supplier_number)`
      );
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500);
    res.send(err.message);
    next(err);
  }
};
const getCustomers = async (req, res, next) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT * FROM Customer");
        res.json(result.recordset);
    } catch (err) {
        res.status(500);
        res.send(err.message);
        next(err);
    }
};
const getCustomerById = async (req, res, next) => {
    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input("id", sql.Int, req.params.id)
            .query("SELECT * FROM Customer WHERE id = @id");
        if (result.recordset.length === 0) {
            res.status(404);
            res.send("Customer not found");
        } else {
            res.json(result.recordset[0]);
        }
    } catch (err) {
        res.status(500);
        res.send(err.message);
        next(err);
    }
};
const updateCustomer = async (req, res, next) => {
    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input("id", sql.Int, req.params.id)
            .input("customer_name", sql.NVarChar, req.body.name)
            .input("email", sql.NVarChar, req.body.email)
            .input("phone_number", sql.NVarChar, req.body.phone)
            .input("contract_number", sql.NVarChar, req.body.contract_number)
            .input("supplier_number", sql.NVarChar, req.body.supplier_number)
            .query(
                `UPDATE Customer SET customer_name = @customer_name, email = @email, phone_number = @phone_number, contract_number = @contract_number, supplier_number = @supplier_number WHERE id = @id`
            );
        if (result.rowsAffected[0] === 0) {
            res.status(404);
            res.send("Customer not found");
        } else {
            res.json({ id: req.params.id, ...req.body });
        }
    } catch (err) {
        res.status(500);
        res.send(err.message);
        next(err);
    }
};
const deleteCustomer = async (req, res, next) => {
    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input("id", sql.Int, req.params.id)
            .query("DELETE FROM Customer WHERE id = @id");
        if (result.rowsAffected[0] === 0) {
            res.status(404);
            res.send("Customer not found");
        } else {
            res.json({ id: req.params.id });
        }
    } catch (err) {
        res.status(500);
        res.send(err.message);
        next(err);
    }
};
module.exports = {
  addCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
