import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const products = [
  { id: 1, name: "Test Ürün 1", price: 100 },
  { id: 2, name: "Test Ürün 2", price: 200 },
  { id: 3, name: "Test Ürün 3", price: 300 },
];

app.get("/api/products", (req, res) => {
  res.json(products);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Backend çalýþýyor:", PORT));
