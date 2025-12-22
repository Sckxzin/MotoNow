const API = "https://motonow-production.up.railway.app";

let produtos = [];
let carrinho = [];

/* =========================
   LOGIN / LOGOUT
========================= */
async function login() {
  const login = document.getElementById("login").value;
  const senha = document.getElementById("senha").value;

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, senha })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Erro no login");
      return;
    }

    localStorage.setItem("token", data.token);
    window.location.href = "vendas.html";
  } catch {
    alert("Erro de conexão");
  }
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

/* =========================
   PRODUTOS
========================= */
async function carregarProdutos() {
  const token = localStorage.getItem("token");
  if (!token) return logout();

  try {
    const res = await fetch(`${API}/produtos`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    produtos = await res.json();
    renderProdutos();
  } catch (err) {
    console.error("Erro ao carregar produtos", err);
  }
}

function renderProdutos() {
  const lista = document.getElementById("listaProdutos");
  if (!lista) return;

  const texto = document.getElementById("filtroTexto").value.toLowerCase();
  const tipo = document.getElementById("filtroTipo").value;
  const modelo = document.getElementById("filtroModelo").value;

  lista.innerHTML = "";

  produtos
    .filter(p =>
      (!texto || p.nome.toLowerCase().includes(texto) || p.codigo.toLowerCase().includes(texto)) &&
      (!tipo || p.tipo === tipo) &&
      (!modelo || p.modelo === modelo)
    )
    .forEach(p => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>
          ${p.codigo} - ${p.nome} (${p.modelo}) - R$ ${Number(p.valor_sugerido).toFixed(2)}
        </span>
        <button onclick='addCarrinho(${JSON.stringify(p)})'>Adicionar</button>
      `;
      lista.appendChild(li);
    });
}

/* =========================
   CARRINHO
========================= */
function addCarrinho(produto) {
  carrinho.push({ ...produto });
  renderCarrinho();
}

function renderCarrinho() {
  const lista = document.getElementById("listaCarrinho");
  lista.innerHTML = "";

  carrinho.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${p.nome} - R$ ${Number(p.valor_sugerido).toFixed(2)}</span>
      <button onclick="remover(${i})">X</button>
    `;
    lista.appendChild(li);
  });
}

function remover(index) {
  carrinho.splice(index, 1);
  renderCarrinho();
}

/* =========================
   FINALIZAR VENDA
========================= */
async function finalizarVenda() {
  if (carrinho.length === 0) {
    alert("Carrinho vazio");
    return;
  }

  const nome = document.getElementById("clienteNome").value;
  const cpf = document.getElementById("clienteCpf").value;
  const telefone = document.getElementById("clienteTelefone").value;
  const formaPagamento = document.getElementById("formaPagamento").value;

  if (!nome || !cpf || !telefone || !formaPagamento) {
    alert("Preencha todos os dados do cliente");
    return;
  }

  const token = localStorage.getItem("token");

  try {
    const vendaRes = await fetch(`${API}/vendas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        cliente_nome: nome,
        cliente_cpf: cpf,
        cliente_telefone: telefone,
        forma_pagamento: formaPagamento
      })
    });

    const vendaData = await vendaRes.json();
    const vendaId = vendaData.venda_id;

    for (const item of carrinho) {
      await fetch(`${API}/vendas/${vendaId}/itens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          produto_id: item.id,
          quantidade: 1,
          valor_unitario: item.valor_sugerido
        })
      });
    }

    await fetch(`${API}/vendas/${vendaId}/finalizar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    carrinho = [];
    renderCarrinho();

    alert("Venda finalizada com sucesso!");
  } catch (err) {
    console.error(err);
    alert("Erro ao finalizar venda");
  }
}

/* =========================
   AUTO LOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("listaProdutos")) {
    carregarProdutos();

    document.getElementById("filtroTexto").oninput = renderProdutos;
    document.getElementById("filtroTipo").onchange = renderProdutos;
    document.getElementById("filtroModelo").onchange = renderProdutos;
  }
});
