const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../../dbconnect');

router.get('/billwise', async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();
    console.log("hi")

   request.input('fdate', sql.VarChar, req.query.fdate);
request.input('tdate', sql.VarChar, req.query.tdate);
request.input('branch', sql.Int, parseInt(req.query.branch) || 0);
request.input('paytype', sql.VarChar, req.query.paytype || '');
request.input('status', sql.Char, req.query.status || '0');
request.input('type', sql.VarChar, req.query.type || '');



    const result = await request.execute('Pr_fetch_Sales_InvoiceWise_onlinereport');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});


module.exports = router;
