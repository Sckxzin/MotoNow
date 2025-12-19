const API = "https://motonow-production.up.railway.app";

let produtos = [];
let carrinho = [];

/* =========================
   LOGIN
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
      document.getElementById("erro").innerText = data.message || "Erro no login";
      return;
    }

    localStorage.setItem("token", data.token);
    window.location.href = "vendas.html";

  } catch {
    document.getElementById("erro").innerText = "Erro de conexão";
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

  const res = await fetch(`${API}/produtos`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  produtos = await res.json();
  renderProdutos();
}

function renderProdutos() {
  const lista = document.getElementById("listaProdutos");
  if (!lista) return;

  const texto = document.getElementById("filtroTexto").value.toLowerCase();
  const tipo = document.getElementById("filtroTipo").value;

  lista.innerHTML = "";

  produtos
    .filter(p =>
      (!texto || p.nome.toLowerCase().includes(texto) || p.codigo.toLowerCase().includes(texto)) &&
      (!tipo || p.tipo === tipo)
    )
    .forEach(p => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${p.nome} - R$ ${Number(p.valor_sugerido).toFixed(2)}</span>
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
   FINALIZAR
========================= */
async function finalizarVenda() {
  if (carrinho.length === 0) {
    alert("Carrinho vazio");
    return;
  }

  const token = localStorage.getItem("token");

  try {
    /* 1️⃣ Criar a venda */
    const vendaRes = await fetch(`${API}/vendas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ tipo: "VENDA" })
    });

    const vendaData = await vendaRes.json();
    const vendaId = vendaData.venda_id;

    /* 2️⃣ Adicionar itens */
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

    /* 3️⃣ Finalizar venda */
    await fetch(`${API}/vendas/${vendaId}/finalizar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    alert("Venda registrada com sucesso!");

    carrinho = [];
    renderCarrinho();

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
  }
});
