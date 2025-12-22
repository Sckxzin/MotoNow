require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const produtosRoutes = require("./routes/produtos");
const vendasRoutes = require("./routes/vendas");
const revisoesRoutes = require("./routes/revisoes");
const motosRoutes = require("./routes/motos");


const app = express();

/* ===============================
   CORS CORRETO PARA RAILWAY
================================ */
app.use(cors({
  origin: "*", // libera frontend Railway
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/produtos", produtosRoutes);
app.use("/vendas", vendasRoutes);
app.use("/revisoes", revisoesRoutes);
app.use("/motos", motosRoutes);

/* ===============================
   PORTA (IMPORTANTE)
================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Backend rodando na porta", PORT);
});
