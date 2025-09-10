const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../../dbconnect');

// 📌 GET Billwise Balance Data
router.get('/customerbalance', async (req, res) => {
  try {
    const { cusid, tdt, type, status, branch, paytype } = req.query;

    const pool = await poolPromise;
    const result = await pool.request()
      .input('cusid', sql.Int, parseInt(cusid))
      .input('tdt', sql.VarChar(50), tdt)
      .input('type', sql.Char(1), type)
      .input('status', sql.Char(1), status)
      .input('branch', sql.Int, parseInt(branch))
      .input('paytype', sql.Int, parseInt(paytype))
      .execute('pr_fetch_billwise_balance');

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching billwise balance:', err);
    res.status(500).send(err.message);
  }
});

// 📌 POST Insert Customer Balance Entry
router.post('/customerbalanceinsert', async (req, res) => {
  try {
    const {
      CB_Cusid,
      CB_Billno,
      CB_BillDate,
      CB_Branch,
      CB_TType,
      CB_Date,
      CB_AmountIN,
      CB_AmountOUT,
      CB_Disc,
      CB_Status,
      CB_PType,
      CB_RefNo,
      CB_Remarks,
      CB_CDate,
      CB_User,
      CB_RcdStatus,
      CB_Bankid,
      CB_Voucher,
      CB_Acc,
      CB_UniqueNo,
      CB_PCash,
      cb_credittype,
      cb_accounts
    } = req.body;

    const pool = await poolPromise;
    const request = pool.request();

    request
      .input('CB_Cusid', sql.Int, CB_Cusid)
      .input('CB_Billno', sql.VarChar(sql.MAX), CB_Billno)
      .input('CB_BillDate', sql.VarChar(sql.MAX), CB_BillDate)
      .input('CB_Branch', sql.Int, CB_Branch)
      .input('CB_TType', sql.VarChar(sql.MAX), CB_TType)
      .input('CB_Date', sql.DateTime, CB_Date)
      .input('CB_AmountIN', sql.Decimal(18, 2), CB_AmountIN)
      .input('CB_AmountOUT', sql.Decimal(18, 2), CB_AmountOUT)
      .input('CB_Disc', sql.Decimal(18, 2), CB_Disc)
      .input('CB_Status', sql.Char(1), CB_Status)
      .input('CB_PType', sql.VarChar(sql.MAX), CB_PType)
      .input('CB_RefNo', sql.VarChar(sql.MAX), CB_RefNo)
      .input('CB_Remarks', sql.VarChar(sql.MAX), 'Mobile')
      .input('CB_CDate', sql.DateTime, CB_CDate)
      .input('CB_User', sql.Int, CB_User)
      .input('CB_RcdStatus', sql.Char(1), CB_RcdStatus)
      .input('CB_Bankid', sql.Int, CB_Bankid)
      .input('CB_Voucher', sql.VarChar(sql.MAX), CB_Voucher)
      .input('CB_Acc', sql.Int, CB_Acc)
      .input('CB_UniqueNo', sql.VarChar(sql.MAX), CB_UniqueNo)
      .input('CB_PCash', sql.Decimal(18, 2), CB_PCash)
      .input('cb_credittype', sql.VarChar(sql.MAX), cb_credittype)
      .input('cb_accounts', sql.Int, cb_accounts);

    await request.execute('pr_insert_Balance_mobile');

    res.status(200).json({ message: 'Customer balance inserted successfully' });
  } catch (err) {
    console.error('Error inserting balance:', err);
    res.status(500).send(err.message);
  }
});

module.exports = router;
