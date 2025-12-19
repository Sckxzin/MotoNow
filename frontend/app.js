const API = "https://motonow-production.up.railway.app";
let carrinho = [];

/* LOGIN */
async function login() {
  const login = document.getElementById("login").value;
  const senha = document.getElementById("senha").value;

  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, senha })
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem("token", data.token);
    window.location = "app.html";
  } else {
    document.getElementById("erro").innerText = "Login inválido";
  }
}

/* LOGOUT */
function logout() {
  localStorage.clear();
  window.location = "index.html";
}

/* PRODUTOS */
async function carregarProdutos() {
  const res = await fetch(`${API}/produtos`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  });

  const produtos = await res.json();
  const div = document.getElementById("produtos");

  produtos.forEach(p => {
    const el = document.createElement("div");
    el.innerHTML = `
      <p>${p.nome} - R$ ${p.valor_sugerido}</p>
      <button onclick='addCarrinho(${JSON.stringify(p)})'>Adicionar</button>
    `;
    div.appendChild(el);
  });
}

/* CARRINHO */
function addCarrinho(produto) {
  carrinho.push({
    produto_id: produto.id,
    nome: produto.nome,
    valor: produto.valor_sugerido,
    quantidade: 1
  });
  renderCarrinho();
}

function renderCarrinho() {
  const div = document.getElementById("carrinho");
  div.innerHTML = "";
  carrinho.forEach(i => {
    div.innerHTML += `<p>${i.nome} - R$ ${i.valor}</p>`;
  });
}

/* FINALIZAR */
async function finalizarVenda() {
  await fetch(`${API}/vendas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({ itens: carrinho })
  });

  alert("Venda realizada!");
  carrinho = [];
  renderCarrinho();
}

/* AUTOLOAD */
if (window.location.pathname.includes("app.html")) {
  carregarProdutos();
}
