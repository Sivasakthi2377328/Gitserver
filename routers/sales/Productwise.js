const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../../dbconnect');

router.get('/productwise', async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();

    request.input('fdate', sql.VarChar, req.query.fdate);
    request.input('tdate', sql.VarChar, req.query.tdate);
    request.input('branch', sql.Int, parseInt(req.query.branch) || 0);
    request.input('type', sql.VarChar, req.query.type || '');
    request.input('product', sql.VarChar, req.query.product || '');
    request.input('status', sql.Char, req.query.status || '0');

    const result = await request.execute('Pr_fetch_sales_prodwise');
    
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
router.get('/productsearch', async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();

    const result = await request.query(`
      SELECT  
        PM_id         AS ID,
        pm_name       AS Product,
        pm_tname      AS TamilProduct,
        pm_brand      AS Brand,
        pm_hsncode    AS HSNCode,
        pm_GST        AS [GST%],
        pm_Cess       AS Cess,
        pm_Code       AS Code,
        pm_type       AS Type,
        pm_branch     AS Branch,
        pm_ratetype   AS RateType,
        pm_barcode    AS Barcode
      FROM 
        Product_Master
      WHERE 
        pm_Status = 'A'
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});


module.exports = router;
