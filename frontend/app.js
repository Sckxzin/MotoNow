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

  lista.innerHTML = "";

  produtos
    .filter(p =>
      (!texto ||
        p.nome.toLowerCase().includes(texto) ||
        p.codigo.toLowerCase().includes(texto)) &&
      (!tipo || p.tipo === tipo)
    )
    .forEach(p => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${p.nome} - R$ ${Number(p.valor_sugerido).toFixed(2)}</span>
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

  // Mostrar dados da moto apenas se houver revisão
  const temRevisao = carrinho.some(i => i.tipo === "REVISAO");
  const dadosMoto = document.getElementById("dadosMoto");
  if (dadosMoto) {
    dadosMoto.style.display = temRevisao ? "block" : "none";
  }
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

  // Dados do cliente
  const nome = document.getElementById("clienteNome").value;
  const cpf = document.getElementById("clienteCpf").value;
  const telefone = document.getElementById("clienteTelefone").value;

  if (!nome || !cpf || !telefone) {
    alert("Preencha os dados do cliente");
    return;
  }

  // Forma de pagamento
  const formaPagamento =
    document.getElementById("formaPagamento").value;
  if (!formaPagamento) {
    alert("Informe a forma de pagamento");
    return;
  }

  // Revisão
  const temRevisao = carrinho.some(i => i.tipo === "REVISAO");
  let modeloMoto = null;
  let chassiMoto = null;

  if (temRevisao) {
    modeloMoto = document.getElementById("modeloMoto").value;
    chassiMoto = document.getElementById("chassiMoto").value;

    if (!modeloMoto || !chassiMoto) {
      alert("Informe modelo e chassi da moto");
      return;
    }
  }

  const token = localStorage.getItem("token");

  try {
    /* 1️⃣ Criar venda COM dados do cliente */
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

    /* 2️⃣ Itens */
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
      headers: { Authorization: `Bearer ${token}` }
    });

    /* 4️⃣ Salvar NOTA */
    localStorage.setItem("notaFiscal", JSON.stringify({
      cliente: { nome, cpf, telefone },
      moto: temRevisao ? { modelo: modeloMoto, chassi: chassiMoto } : null,
      itens: carrinho.map(i => ({
        codigo: i.codigo,
        nome: i.nome,
        quantidade: 1,
        valor: i.valor_sugerido
      })),
      total: carrinho.reduce(
        (s, i) => s + Number(i.valor_sugerido),
        0
      ),
      forma_pagamento: formaPagamento,
      data: new Date()
    }));

    carrinho = [];
    renderCarrinho();

    /* 5️⃣ Abrir nota automaticamente */
    window.location.href = "nota.html";

  } catch (err) {
    console.error(err);
    alert("Erro ao finalizar venda");
  }
}

/* =========================
   AUTO LOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
  // Vendas
  if (document.getElementById("listaProdutos")) {
    carregarProdutos();
    document.getElementById("filtroTexto").oninput = renderProdutos;
    document.getElementById("filtroTipo").onchange = renderProdutos;
  }

  // Nota
  const nota = localStorage.getItem("notaFiscal");
  if (!nota) return;

  const data = JSON.parse(nota);

  if (document.getElementById("nfCliente")) {
    document.getElementById("nfCliente").innerText = data.cliente.nome;
    document.getElementById("nfCpf").innerText = data.cliente.cpf;
    document.getElementById("nfTelefone").innerText =
      data.cliente.telefone;
    document.getElementById("nfTotal").innerText =
      data.total.toFixed(2);
    document.getElementById("nfPagamento").innerText =
      data.forma_pagamento;
    document.getElementById("nfData").innerText =
      new Date(data.data).toLocaleString("pt-BR");

    const tbody = document.getElementById("nfItens");
    tbody.innerHTML = "";

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
  }
});
