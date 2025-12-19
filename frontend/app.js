const API = "http://localhost:3000"; // depois troca pela URL do Railway
let token = "";
let carrinho = [];
let vendaId = null;

function login() {
  fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      login: document.getElementById("login").value,
      senha: document.getElementById("senha").value
    })
  })
  .then(r => r.json())
  .then(d => {
    token = d.token;
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    criarVenda();
    carregarProdutos();
  });
}

function logout() {
  location.reload();
}

function mostrar(id) {
  document.getElementById("produtos").classList.add("hidden");
  document.getElementById("carrinho").classList.add("hidden");
  document.getElementById(id).classList.remove("hidden");
}

function criarVenda() {
  fetch(`${API}/vendas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({})
  })
  .then(r => r.json())
  .then(d => vendaId = d.venda_id);
}

function carregarProdutos() {
  fetch(`${API}/produtos`, {
    headers: { "Authorization": "Bearer " + token }
  })
  .then(r => r.json())
  .then(produtos => {
    const div = document.getElementById("produtos");
    div.innerHTML = "<h2>Produtos</h2>";

    produtos.forEach(p => {
      div.innerHTML += `
        <div class="card">
          <b>${p.nome}</b> (${p.tipo})<br>
          Valor sugerido: R$ ${p.valor_sugerido}<br>
          <input type="number" id="valor-${p.id}" value="${p.valor_sugerido}">
          <label>
            <input type="checkbox" id="brinde-${p.id}"> Brinde
          </label>
          <button onclick="addCarrinho(${p.id}, '${p.tipo}')">Adicionar</button>
        </div>
      `;
    });
  });
}

function addCarrinho(id, tipo) {
  const valor = Number(document.getElementById(`valor-${id}`).value);
  const brinde = document.getElementById(`brinde-${id}`).checked;

  fetch(`${API}/vendas/${vendaId}/itens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({
      produto_id: id,
      quantidade: 1,
      valor_unitario: valor,
      brinde
    })
  })
  .then(() => {
    carrinho.push({ id, valor, brinde });
    renderCarrinho();
  });
}

function renderCarrinho() {
  mostrar("carrinho");
  const div = document.getElementById("carrinho");
  div.innerHTML = "<h2>Carrinho</h2>";

  carrinho.forEach(c => {
    div.innerHTML += `<p>Produto ${c.id} - R$ ${c.valor}</p>`;
  });

  div.innerHTML += `<button onclick="finalizar()">Finalizar Venda</button>`;
}

function finalizar() {
  fetch(`${API}/vendas/${vendaId}/finalizar`, {
    method: "POST",
    headers: { "Authorization": "Bearer " + token }
  })
  .then(() => {
    alert("Venda finalizada!");
    location.reload();
  });
}
