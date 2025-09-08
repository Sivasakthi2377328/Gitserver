const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../../dbconnect');

router.get('/productwise', async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();
    console.log("product")

    request.input('fdate', sql.VarChar, req.query.fdate);
    request.input('tdate', sql.VarChar, req.query.tdate);
    request.input('branch', sql.Int, parseInt(req.query.branch) || 0);
    request.input('type', sql.VarChar, req.query.type || '');
    request.input('product', sql.VarChar, req.query.product || '');
    request.input('status', sql.Char,  '1');

    const result = await request.execute('Pr_fetch_Purchase_prodwise');
    console.log(result.recordset)
    
    // Format the response data
    const formattedData = result.recordset.map(item => ({
      ...item,
      Qty: parseFloat(item.Qty) || 0,
      Amount: parseFloat(item.Amount) || 0,
      CGST: parseFloat(item.CGST) || 0,
      SGST: parseFloat(item.SGST) || 0,
      IGST: parseFloat(item.IGST) || 0,
      Net: parseFloat(item.Net) || 0,
      BasicRate: parseFloat(item.BasicRate) || 0
    }));

    res.json(formattedData);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

module.exports = router;
