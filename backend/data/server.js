const express = require("express");
const cors = require("cors");

console.log("🔥 THIS IS server.js RUNNING");

const app = express();

app.use(cors());
app.use(express.json());

// mount products routes
app.use("/products", require("./routes/products"));
app.use("/orders", require("./routes/orders"));

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
