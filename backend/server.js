require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const produtosRoutes = require("./routes/produtos");
const vendasRoutes = require("./routes/vendas");
const revisoesRoutes = require("./routes/revisoes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/produtos", produtosRoutes);
app.use("/vendas", vendasRoutes);
app.use("/revisoes", revisoesRoutes);

app.listen(process.env.PORT, () => {
  console.log("🚀 Backend rodando");
});
