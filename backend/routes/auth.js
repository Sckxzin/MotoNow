const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

router.post("/login", (req, res) => {
  const { login, senha } = req.body;

  if (!login || !senha) {
    return res.status(400).json({ message: "Login e senha obrigatórios" });
  }

  db.query(
    "SELECT id, login, senha, perfil, filial FROM usuarios WHERE login = ? AND senha = ?",
    [login, senha],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Erro no servidor" });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: "Login inválido" });
      }

      const user = results[0];

      const token = jwt.sign(
        {
          id: user.id,
          perfil: user.perfil,
          filial: user.filial   // 👈 ESSENCIAL
        },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      res.json({ token });
    }
  );
});

module.exports = router;
