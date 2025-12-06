require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rfpRoutes = require("./src/routes/rfp.routes");
const vendorRoutes = require("./src/routes/vendor.routes");
const inboundRoutes = require("./src/routes/inbound.routes");
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/rfps", rfpRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/inbound", inboundRoutes);


app.get('/', (req, res) => res.json({ ok: true, service: 'rfp-backend' }));

const start = async () => {
  const mongoUrl = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/ai_rfp_mvp';
  try {
    // NOTE: do not pass deprecated options like useNewUrlParser/useUnifiedTopology here.
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }

  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log('Backend listening on', port));
};
console.log("Loaded SMTP:", process.env.SMTP_HOST);


start();