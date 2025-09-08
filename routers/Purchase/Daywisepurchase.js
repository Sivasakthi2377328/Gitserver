const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../../dbconnect');

// Get branches for dropdown
router.get('/branches', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT branch_id AS ID, branch_name AS Name, branch_code AS Code 
      FROM Branch_Master 
      ORDER BY branch_name
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// Get cities for dropdown
router.get('/cities', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT DISTINCT Cus_city AS City 
      FROM Customer_Master 
      WHERE Cus_city IS NOT NULL AND Cus_city <> ''
      ORDER BY Cus_city
    `);
    res.json(result.recordset.map(c => c.City));
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// Daily purchase report
router.get('/billwise', async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();

    request.input('fdate', sql.VarChar, req.query.fdate);
    request.input('tdate', sql.VarChar, req.query.tdate);
    request.input('branch', sql.VarChar, req.query.branch || 'ALL');
    request.input('city', sql.VarChar, req.query.city || '');
    request.input('status', sql.Char,  '1');

    const result = await request.execute('Pr_fetch_Daily_Purchase_Report');
    
    // Format the response data
    const formattedData = result.recordset.map(item => ({
      ...item,
      Qty: parseFloat(item.Qty) || 0,
      Rate: parseFloat(item.Rate) || 0,
      Total: parseFloat(item.Total) || 0,
      Dis: parseFloat(item.Dis) || 0,
      Amount: parseFloat(item.Amount) || 0,
      GSTAmount: parseFloat(item.GSTAmount) || 0,
      CessAmount: parseFloat(item.CessAmount) || 0,
      Freight: parseFloat(item.Freight) || 0,
      ODisc: parseFloat(item.ODisc) || 0,
      Net: parseFloat(item.Net) || 0
    }));

    res.json(formattedData);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

module.exports = router;