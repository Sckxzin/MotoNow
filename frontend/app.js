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
      document.getElementById("erro").innerText =
        data.message || "Erro no login";
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

  const texto = document
    .getElementById("filtroTexto")
    .value.toLowerCase();

  const tipo = document.getElementById("filtroTipo").value;
  const modelo = document.getElementById("filtroModelo").value;

  lista.innerHTML = "";

  produtos
    .filter(p => {
      return (
        (!texto ||
          p.nome.toLowerCase().includes(texto) ||
          p.codigo.toLowerCase().includes(texto)) &&
        (!tipo || p.tipo === tipo) &&
        (!modelo || p.modelo === modelo)
      );
    })
    .forEach(p => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div>
          <b>${p.nome}</b><br>
          <small>Código: ${p.codigo}</small><br>
          <small>Modelo: ${p.modelo}</small><br>
          <small>Estoque: ${p.estoque}</small><br>
          <b>R$ ${Number(p.valor_sugerido).toFixed(2)}</b>
        </div>
        <button onclick='addCarrinho(${JSON.stringify(p)})'>
          Adicionar
        </button>
      `;
      lista.appendChild(li);
    });
}

/* =========================
   CARRINHO
========================= */
function addCarrinho(produto) {
  carrinho.push({
    ...produto,
    valor: Number(produto.valor_sugerido)
  });
  renderCarrinho();
}

function renderCarrinho() {
  const lista = document.getElementById("listaCarrinho");
  if (!lista) return;

  lista.innerHTML = "";

  carrinho.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <b>${p.nome}</b><br>
        <input type="number"
          value="${p.valor}"
          step="0.01"
          onchange="alterarValor(${i}, this.value)"
        />
      </div>
      <button onclick="remover(${i})">X</button>
    `;
    lista.appendChild(li);
  });
}

function alterarValor(index, novoValor) {
  carrinho[index].valor = Number(novoValor);
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
  const formaPagamento =
    document.getElementById("formaPagamento").value;

  if (!nome || !cpf || !telefone || !formaPagamento) {
    alert("Preencha os dados do cliente");
    return;
  }

  const token = localStorage.getItem("token");

  try {
    // Criar venda
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

    // Itens da venda
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
          valor_unitario: item.valor
        })
      });
    }

    // Finalizar
    await fetch(`${API}/vendas/${vendaId}/finalizar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    // Salvar NOTA
    localStorage.setItem(
      "notaFiscal",
      JSON.stringify({
        cliente: { nome, cpf, telefone },
        itens: carrinho.map(i => ({
          codigo: i.codigo,
          nome: i.nome,
          quantidade: 1,
          valor: i.valor
        })),
        total: carrinho.reduce((s, i) => s + i.valor, 0),
        forma_pagamento: formaPagamento,
        data: new Date()
      })
    );

    carrinho = [];
    renderCarrinho();
    window.location.href = "nota.html";
  } catch (err) {
    console.error(err);
    alert("Erro ao finalizar venda");
  }
}

/* =========================
   AUTO LOAD - VENDAS
========================= */
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("listaProdutos")) {
    carregarProdutos();
    document.getElementById("filtroTexto").oninput = renderProdutos;
    document.getElementById("filtroTipo").onchange = renderProdutos;
    document.getElementById("filtroModelo").onchange = renderProdutos;
  }
});

/* =========================
   NOTA (PROTEGIDO)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("nfCliente")) return;

  const nota = localStorage.getItem("notaFiscal");
  if (!nota) return;

  const data = JSON.parse(nota);

  document.getElementById("nfCliente").innerText = data.cliente.nome;
  document.getElementById("nfCpf").innerText = data.cliente.cpf;
  document.getElementById("nfTelefone").innerText = data.cliente.telefone;
  document.getElementById("nfTotal").innerText =
    data.total.toFixed(2);
  document.getElementById("nfPagamento").innerText =
    data.forma_pagamento;
  document.getElementById("nfData").innerText =
    new Date(data.data).toLocaleString("pt-BR");

  const tbody = document.getElementById("nfItens");
  data.itens.forEach(i => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i.codigo}</td>
      <td>${i.nome}</td>
      <td>${i.quantidade}</td>
      <td>R$ ${Number(i.valor).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
});
