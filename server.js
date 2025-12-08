const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const products = require("./data/products.json");

app.get("/", (req, res) => {
  res.send("Backend çalışıyor Mira bebegim!");
});

app.get("/api/products", (req, res) => {
  res.json(products);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("SUNUCU AÇILDI:", PORT));
