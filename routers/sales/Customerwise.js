const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../../dbconnect');

router.get('/customerwise', async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();

    request.input('fdate', sql.VarChar, req.query.fdate || '19000101');
    request.input('tdate', sql.VarChar, req.query.tdate || '20991231');
    request.input('branch', sql.Int, parseInt(req.query.branchId) || 0);
    request.input('cusid', sql.Int, parseInt(req.query.customerId) || 0);
    request.input('status', sql.Char, req.query.status || '1');

    const result = await request.execute('Pr_fetch_sales_cuswise_onlinereport');
    
    // Transform the data for frontend
    const transformedData = result.recordset.map(item => ({
      billNo: item.BillNo,
      date: item.Date,
      customerName: item.Customer || 'Walk-in Customer',
      productName: item.ProductName,
      quantity: item.Qty || 0,
      total: item.Total || 0,
      discount: item.Dis || 0,
      amount: item.Amount || 0,
      gst: item.GST || 0,
      cessAmount: item.CessAmount || 0,
      freight: item.Freight || 0,
      otherDiscount: item.ODisc || 0,
      netAmount: item.Net || 0,
      paidAmount: item.PaidAmt || 0
    }));

    res.json(transformedData);
  } catch (err) {
    console.error('Error fetching customer sales report:', err);
    res.status(500).send(err.message);
  }
});

module.exports = router;