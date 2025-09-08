const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../../dbconnect');

router.get('/gst-sales-report', async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = pool.request();

    request.input('fdate', sql.VarChar, req.query.fdate || '19000101');
    request.input('tdate', sql.VarChar, req.query.tdate || '20991231');
    request.input('branch', sql.VarChar, req.query.branch || '');
    request.input('city', sql.VarChar, req.query.city || '');
    request.input('type', sql.VarChar, req.query.type || 'GST VAL');
    request.input('status', sql.Char,  '1');
    // console.log(req.query.type)
    // console.log(req.query.req.query.branch)

    const result = await request.execute('Pr_fetch_sales_GSTReport');
    
    // Transform the data for frontend consumption
    const transformedData = result.recordset.map(item => {
      const reportItem = {
        billNo: item.BillNo,
        date: item.Date,
        customer: item.Customer,
        gstNo: item.GSTNo,
        quantity: item.Qty || 0,
        amount: item.Amount || 0,
        netAmount: item.Net || 0
      };

      // Add GST-specific fields based on report type
      if (req.query.type === 'GST VAL') {
        reportItem.gstVal0 = item['GSTVal 0%'] || 0;
        reportItem.gstVal5 = item['GSTVal 5%'] || 0;
        reportItem.cgst2_5 = item['CGST2.5%'] || 0;
        reportItem.sgst2_5 = item['SGST2.5%'] || 0;
        reportItem.igst5 = item['IGST5%'] || 0;
        reportItem.gstVal12 = item['GSTVal 12%'] || 0;
        reportItem.cgst6 = item['CGST6%'] || 0;
        reportItem.sgst6 = item['SGST6%'] || 0;
        reportItem.igst12 = item['IGST12%'] || 0;
        reportItem.gstVal18 = item['GSTVal 18%'] || 0;
        reportItem.cgst9 = item['CGST9%'] || 0;
        reportItem.sgst9 = item['SGST9%'] || 0;
        reportItem.igst18 = item['IGST18%'] || 0;
        reportItem.gstVal28 = item['GSTVal 28%'] || 0;
        reportItem.cgst14 = item['CGST14%'] || 0;
        reportItem.sgst14 = item['SGST14%'] || 0;
        reportItem.igst28 = item['IGST28%'] || 0;
      } else if (req.query.type === 'GST%' || req.query.type === 'GST') {
        reportItem.gst5 = item['GST5%'] || 0;
        reportItem.gst12 = item['GST12%'] || 0;
        reportItem.gst18 = item['GST18%'] || 0;
        reportItem.gst28 = item['GST28%'] || 0;
      }
      
      reportItem.cessAmount = item.CessAmount || 0;
      reportItem.freight = item.Freight || 0;
      reportItem.discount = item.ODisc || 0;

      return reportItem;
    });

    res.json(transformedData);
  } catch (err) {
    console.error('Error fetching GST sales report:', err);
    res.status(500).send(err.message);
  }
});

module.exports = router;