// src/app.js
const express = require('express');
const bodyParser = require('body-parser');
//const auth = require('./middleware/auth');
const ordersRouter = require('./routes/orders');
const paymentsRouter = require('./routes/payments');
const couponsRouter = require('./routes/coupons');

const app = express();
app.use(bodyParser.json());

// mount auth middleware for user endpoints
//app.use('/api/v1', auth);

app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/coupons', couponsRouter);

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
