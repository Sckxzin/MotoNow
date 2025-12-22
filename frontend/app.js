const API = "https://motonow-production.up.railway.app";

let produtos = [];
let carrinho = [];

/* =========================
   AUTH
========================= */
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

    if (!res.ok) throw new Error("Erro ao buscar produtos");

    produtos = await res.json();
    preencherFiltroModelo();
    renderProdutos();
  } catch (err) {
    console.error(err);
    alert("Erro ao carregar produtos");
  }
}

function preencherFiltroModelo() {
  const select = document.getElementById("filtroModelo");
  if (!select) return;

  const modelos = [...new Set(produtos.map(p => p.modelo).filter(Boolean))];

  select.innerHTML = `<option value="">Todos os Modelos</option>`;
  modelos.forEach(m => {
    select.innerHTML += `<option value="${m}">${m}</option>`;
  });
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
      (!modelo || p.modelo === modelo) &&
      p.estoque > 0
    )
    .forEach(p => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>
          <b>${p.nome}</b><br>
          Código: ${p.codigo}<br>
          Modelo: ${p.modelo}<br>
          Estoque: ${p.estoque}<br>
          <b>R$ ${Number(p.valor_sugerido).toFixed(2)}</b>
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
  carrinho.push({
    ...produto,
    quantidade: 1,
    valor_unitario: Number(produto.valor_sugerido)
  });
  renderCarrinho();
}

function renderCarrinho() {
  const lista = document.getElementById("listaCarrinho");
  if (!lista) return;

  lista.innerHTML = "";

  carrinho.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>
        ${item.nome}<br>
        <input type="number" min="1" value="${item.quantidade}"
          onchange="alterarQtd(${index}, this.value)">
        <input type="number" step="0.01" value="${item.valor_unitario}"
          onchange="alterarValor(${index}, this.value)">
      </span>
      <button onclick="remover(${index})">X</button>
    `;
    lista.appendChild(li);
  });
}

function alterarQtd(index, qtd) {
  carrinho[index].quantidade = Number(qtd);
}

function alterarValor(index, valor) {
  carrinho[index].valor_unitario = Number(valor);
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
    // 1️⃣ Criar venda
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

    const venda = await vendaRes.json();

    // 2️⃣ Itens
    for (const item of carrinho) {
      await fetch(`${API}/vendas/${venda.id}/itens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          produto_id: item.id,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario
        })
      });
    }

    // 3️⃣ Nota Fiscal
    localStorage.setItem("notaFiscal", JSON.stringify({
      cliente: { nome, cpf, telefone },
      itens: carrinho.map(i => ({
        codigo: i.codigo,
        nome: i.nome,
        quantidade: i.quantidade,
        valor: i.valor_unitario
      })),
      total: carrinho.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0),
      forma_pagamento: formaPagamento,
      data: new Date()
    }));

    carrinho = [];
    renderCarrinho();
    window.location.href = "nota.html";

  } catch (err) {
    console.error(err);
    alert("Erro ao finalizar venda");
  }
}

/* =========================
   NOTA FISCAL (SÓ NA nota.html)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const nfCliente = document.getElementById("nfCliente");
  if (!nfCliente) return;

  const nota = localStorage.getItem("notaFiscal");
  if (!nota) return;

  const data = JSON.parse(nota);

  document.getElementById("nfCliente").innerText = data.cliente.nome;
  document.getElementById("nfCpf").innerText = data.cliente.cpf;
  document.getElementById("nfTelefone").innerText = data.cliente.telefone;
  document.getElementById("nfTotal").innerText = data.total.toFixed(2);
  document.getElementById("nfPagamento").innerText = data.forma_pagamento;
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
});

/* =========================
   AUTOLOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("listaProdutos")) {
    carregarProdutos();
    document.getElementById("filtroTexto").oninput = renderProdutos;
    document.getElementById("filtroTipo").onchange = renderProdutos;
    document.getElementById("filtroModelo").onchange = renderProdutos;
  }
});
