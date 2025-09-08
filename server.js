const express = require('express');
const cors = require('cors');
const { sql, poolPromise } = require('./dbconnect');
const salesRoutes = require('./routers/sales/billwisereport');
const commonRouter=require('./commondetails')
const customerwiseReportRouter=require("./routers/sales/Customerwise")
const Stockrouter=require("./routers/stock/stock")
const salesauditor=require("./routers/sales/Auditorwise")
const produtwisesales=require("./routers/sales/Productwise")
const daywisepurchase=require("./routers/Purchase/Daywisepurchase")
const productwisepurchase=require("./routers/Purchase/Productwise")
const salesentry=require("./routers/sales/Salesentry")
const receipt=require("./routers/Payment/Receiptentry")
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use('/api/sales', salesRoutes);
app.use('/api/receipt', receipt);
app.use('/api/salesentry', salesentry);
app.use('/api/salescustomer', customerwiseReportRouter); 
app.use('/api/Stockrouter', Stockrouter); 
app.use('/api/common',commonRouter)
app.use('/api/salesauditor',salesauditor)
app.use('/api/produtwisesales',produtwisesales)
app.use('/api/daywisepurchase',daywisepurchase)
app.use('/api/productwisepurchase',productwisepurchase)


app.get('/api/data', async (req, res) => {
  try {
    console.log("")
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT TOP 10 * FROM YourTable');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
