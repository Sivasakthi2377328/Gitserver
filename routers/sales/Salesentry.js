const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../../dbconnect');

// POST /insert
router.post('/insert', async (req, res) => {
  try {
    const {
      customerId, customerName, customerPhone, items, discount = 0, laborCharge = 0,
      transportNo, subtotal, totalTax, accid, grandTotal, branchId = 1, godownId = 1,
      route = '', taxType = 'Excl.Tax', weight = 0, dispatchId = 0, pcQty = 0,
      counter = 0, pcName = '', supType = '', accounts = 0, paymentType
    } = req.body;

    // Additional values
    const Amtinvalue = grandTotal;
    const amtoutvalue = 0;
    const useridvalue = 1;
    const ClipboardItem = 0;
    const creditype = 'REGULAR';

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const billRequest = new sql.Request(transaction);
      billRequest.input('branch', sql.Int, branchId);
      billRequest.input('acc', sql.Int, accid);

      const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
      billRequest.input('fdate', sql.VarChar, formattedDate);

      const billResult = await billRequest.execute('pr_fetchbillno');
      const billNo = billResult.recordset[0].billno;

      // Common values
      const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const customerGSTIN = await getCustomerGSTIN(transaction, customerId);

      let lastUniqueId = '';

      for (const item of items) {
        try {
          const itemRequest = new sql.Request(transaction);
          const productRequest = new sql.Request(transaction);
          productRequest.input('productId', sql.Int, item.productId);

          const productResult = await productRequest.query(`
            SELECT pm_AGCom, pm_cess, pm_gst, pm_purprice, pm_nqty 
            FROM product_master WHERE pm_id = @productId
          `);

          const product = productResult.recordset[0] || {
            pm_AGCom: 0, pm_cess: 0, pm_gst: 0, pm_purprice: 0, pm_nqty: 1
          };

          const salPcs = Math.ceil(item.quantity / product.pm_nqty);
          const uniqueId = `${billNo}-${Date.now()}-${item.productId}`;
          lastUniqueId = uniqueId;

          const mrp = item.mrp || (await getMRP(transaction, item.productId, item.size));

          itemRequest.input('id', sql.Int, 0);
          itemRequest.input('Sal_Billno', sql.VarChar, billNo);
          itemRequest.input('Sal_date', sql.VarChar, currentDate);
          itemRequest.input('Sal_prodid', sql.Int, item.productId);
          itemRequest.input('Sal_cusid', sql.Int, customerId);
          itemRequest.input('Sal_qty', sql.Decimal(18, 2), item.quantity);
          itemRequest.input('Sal_rate', sql.Decimal(18, 10), item.rate);
          itemRequest.input('Sal_Dis', sql.Decimal(18, 2), discount);
          itemRequest.input('Sal_Branch', sql.Int, branchId);
          itemRequest.input('Sal_Qlty', sql.VarChar, item.quality || '');
          itemRequest.input('Sal_size', sql.VarChar, item.size || '');
          itemRequest.input('Sal_RecDt', sql.DateTime, new Date());
          itemRequest.input('Sal_acc', sql.Int, accid);
          itemRequest.input('Sal_user', sql.Int, useridvalue);
          itemRequest.input('sal_cusname', sql.VarChar, customerName);
          itemRequest.input('Sal_AGCom', sql.Decimal(18, 2), product.pm_AGCom);
          itemRequest.input('sal_mrp', sql.Decimal(18, 2), mrp);
          itemRequest.input('sal_gstin', sql.VarChar, customerGSTIN);
          itemRequest.input('Sal_Gst', sql.Decimal(18, 2), item.taxRate || 0);
          itemRequest.input('cess', sql.Decimal(18, 2), product.pm_cess);
          itemRequest.input('sal_Godown', sql.Int, godownId);
          itemRequest.input('sal_Route', sql.VarChar, route);
          itemRequest.input('Sal_PDiscper', sql.Decimal(18, 2), discount);
          itemRequest.input('sal_accid', sql.Int, accid);
          itemRequest.input('Sal_Consignee', sql.Int, customerId);
          itemRequest.input('Sal_Taxtype', sql.VarChar, taxType);
          itemRequest.input('rate', sql.Decimal(18, 2), item.rate);
          itemRequest.input('srate', sql.Decimal(18, 2), item.rate);
          itemRequest.input('sal_uniqID', sql.VarChar, uniqueId);
          itemRequest.input('sal_weight', sql.Decimal(18, 2), weight);
          itemRequest.input('Sal_Despatch', sql.Int, dispatchId);
          itemRequest.input('Sal_Purid', sql.Int, 0);
          itemRequest.input('Sal_PCQty', sql.Int, pcQty);
          itemRequest.input('sal_counter', sql.Int, counter);
          itemRequest.input('sal_pcname', sql.VarChar, pcName);
          itemRequest.input('sal_suptyp', sql.VarChar, supType);
          itemRequest.input('sal_accounts', sql.Int, accounts);

          await itemRequest.execute('pr_insert_salesmobile');
        } catch (itemErr) {
          console.error(`Error inserting productId ${item.productId}:`, itemErr);
          throw itemErr;
        }
      }

      // Update payment type
      const updateRequest = new sql.Request(transaction);
      updateRequest.input('paymentType', sql.VarChar, paymentType);
      updateRequest.input('billNo', sql.VarChar, billNo);
      await updateRequest.query(`
        UPDATE sales SET Sal_type = @paymentType WHERE Sal_Billno = @billNo
      `);

      // Insert/update balance
      await getupdatebalance(
        transaction, customerId, billNo, formattedDate, branchId,
        'SALES', formattedDate, Amtinvalue, amtoutvalue, 0,
        's', paymentType, billNo, 'SALES BILL', useridvalue,
        'B', 0, billNo, accid, lastUniqueId, ClipboardItem, creditype, accounts
      );

      await transaction.commit();

      res.json({
        success: true,
        message: 'Sales entry saved successfully',
        billNo
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error saving sales entry:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to save sales entry',
      error: err.message
    });
  }
});

// ----------------- Helper Functions -----------------
function parseDate(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return new Date(); // fallback
  const year = yyyymmdd.slice(0, 4);
  const month = yyyymmdd.slice(4, 6);
  const day = yyyymmdd.slice(6, 8);
  return new Date(`${year}-${month}-${day}`);
}

async function getupdatebalance(
  transaction, customerId, billNo, billDate, branchId,
  type, date, amountIn, amountOut, disc, status,
  paymentType, refNo, remarks, userId, rcdStatus,
  bankId, voucher, acc, uniqueId, pcash, credittype, accounts
) {

  try {
    console.log(customerId,billNo,billDate,branchId,type,date,amountIn,amountOut,disc,status,paymentType,refNo,remarks,userId,rcdStatus,bankId,voucher,acc,uniqueId,pcash,credittype,accounts)
    const request = new sql.Request(transaction);
    request.input('CB_Cusid', sql.Int, customerId);
    request.input('CB_Billno', sql.VarChar, billNo);
    request.input('CB_BillDate', sql.VarChar, billDate);
    request.input('CB_Branch', sql.Int, branchId);
    request.input('CB_TType', sql.VarChar, type);
    request.input('CB_Date', sql.DateTime, parseDate(date));

    request.input('CB_AmountIN', sql.Decimal(18, 2), amountIn);
    request.input('CB_AmountOUT', sql.Decimal(18, 2), amountOut);
    request.input('CB_Disc', sql.Decimal(18, 2), disc);
    request.input('CB_Status', sql.Char, status);
    request.input('CB_PType', sql.VarChar, paymentType);
    request.input('CB_RefNo', sql.VarChar, refNo);
    request.input('CB_Remarks', sql.VarChar, remarks);
    request.input('CB_CDate', sql.DateTime, new Date());
    request.input('CB_User', sql.Int, userId);
    request.input('CB_RcdStatus', sql.Char, rcdStatus);
    request.input('CB_Bankid', sql.Int, bankId);
    request.input('CB_Voucher', sql.VarChar, voucher);
    request.input('CB_Acc', sql.Int, acc);
    request.input('CB_UniqueNo', sql.VarChar, uniqueId);
    request.input('CB_PCash', sql.Decimal(18, 2), pcash);
    request.input('cb_credittype', sql.VarChar, '1');
    request.input('cb_accounts', sql.Int, accounts);

    await request.execute('pr_insert_Balance');
  } catch (error) {
    console.error('Error inserting balance:', error);
  }
}

async function getCustomerGSTIN(transaction, customerId) {
  try {
    const request = new sql.Request(transaction);
    request.input('customerId', sql.Int, customerId);
    const result = await request.query(`
      SELECT cus_GSTIN FROM customer_master WHERE cus_id = @customerId
    `);
    return result.recordset[0]?.cus_GSTIN || '';
  } catch (error) {
    console.error('Error fetching customer GSTIN:', error);
    return '';
  }
}

async function getMRP(transaction, productId, size) {
  try {
    const request = new sql.Request(transaction);
    request.input('productId', sql.Int, productId);
    request.input('size', sql.VarChar, size || '');
    const result = await request.query(`
      SELECT uom_mrpprice FROM uommaster 
      WHERE uom_proid = @productId AND uom_name = @size
    `);
    return result.recordset[0]?.uom_mrpprice || 0;
  } catch (error) {
    console.error('Error fetching MRP:', error);
    return 0;
  }
}

module.exports = router;
