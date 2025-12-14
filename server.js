require('dotenv').config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const products = require("./data/products.json");
const checkoutRoutes = require("./routes/checkoutRoutes");
const orderRoutes = require("./routes/orderRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

app.get("/", (req, res) => {
  res.send("Backend çalışıyor Mira bebegim!");
});

app.get("/api/products", (req, res) => {
  res.json(products);
});

// Payment and order routes
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/webhooks", webhookRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("SUNUCU AÇILDI:", PORT));
