const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../../dbconnect');

router.get('/currentstock', async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();

    request.input('fdt', sql.VarChar, req.query.fdt || '19000101');
    request.input('tdt', sql.VarChar, req.query.tdt || '20991231');
    request.input('branch', sql.Int, parseInt(req.query.branch) || 0);
    request.input('status', sql.VarChar, req.query.status || '0');
    request.input('type', sql.VarChar, req.query.type || '');
    request.input('godown', sql.Int, parseInt(req.query.godown) || 0);

    const result = await request.execute('pr_currentstock');
    
    // Transform the data to match frontend expectations
    const transformedData = result.recordset.map(item => ({
      id: item.Code,
      name: item.ProductName,
      category: item.Category,
      quantity: item['Box Stock'],
      unit: item.pm_uom || 'units',
      mrp: item.Price || 0,
      cost: item['Purchase Based'] / (item['Box Stock'] || 1),
      value: item['Purchase Based'],
      threshold: 0, // You might want to add this to your stored procedure
      status: item['Box Stock'] <= 5 ? 'Low Stock' : 'In Stock' // Example threshold
    }));

    res.json(transformedData);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

module.exports = router;