const API = "https://motonow-production.up.railway.app";

/* =====================================================
   LOGIN
===================================================== */
async function login() {
  const login = document.getElementById("login").value;
  const senha = document.getElementById("senha").value;
  const erro = document.getElementById("erro");

  if (!login || !senha) {
    erro.innerText = "Informe login e senha";
    return;
  }

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, senha })
    });

    const data = await res.json();

    if (!res.ok) {
      erro.innerText = data.message || "Erro no login";
      return;
    }

    localStorage.setItem("token", data.token);
    window.location.href = "vendas.html";

  } catch (err) {
    console.error(err);
    erro.innerText = "Erro de conexão";
  }
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

/* =====================================================
   PRODUTOS
===================================================== */
let produtos = [];
let carrinho = [];

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
    console.error(err);
    alert("Erro ao carregar produtos");
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
          <b>${p.nome}</b><br>
          Código: ${p.codigo}<br>
          Modelo: ${p.modelo} | Filial: ${p.filial}<br>
          R$ ${Number(p.valor_sugerido).toFixed(2)}
        </span>
        <button onclick='addCarrinho(${JSON.stringify(p)})'>Adicionar</button>
      `;
      lista.appendChild(li);
    });
}

/* =====================================================
   CARRINHO
===================================================== */
function addCarrinho(produto) {
  carrinho.push({
    ...produto,
    quantidade: 1,
    valor: Number(produto.valor_sugerido)
  });
  renderCarrinho();
}

function renderCarrinho() {
  const lista = document.getElementById("listaCarrinho");
  lista.innerHTML = "";

  carrinho.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>
        ${item.nome} (${item.codigo})<br>
        Qtd: <input type="number" min="1" value="${item.quantidade}"
             onchange="alterarQtd(${index}, this.value)">
        Valor: R$ <input type="number" step="0.01" value="${item.valor}"
             onchange="alterarValor(${index}, this.value)">
      </span>
      <button onclick="removerItem(${index})">X</button>
    `;
    lista.appendChild(li);
  });
}

function alterarQtd(index, qtd) {
  carrinho[index].quantidade = Number(qtd);
}

function alterarValor(index, valor) {
  carrinho[index].valor = Number(valor);
}

function removerItem(index) {
  carrinho.splice(index, 1);
  renderCarrinho();
}

/* =====================================================
   FINALIZAR VENDA
===================================================== */
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
    const vendaId = venda.venda_id;

    // 2️⃣ Itens
    for (const item of carrinho) {
      await fetch(`${API}/vendas/${vendaId}/itens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          produto_id: item.id,
          quantidade: item.quantidade,
          valor_unitario: item.valor
        })
      });
    }

    // 3️⃣ Finalizar
    await fetch(`${API}/vendas/${vendaId}/finalizar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    // 4️⃣ Nota fiscal
    localStorage.setItem("notaFiscal", JSON.stringify({
      cliente: { nome, cpf, telefone },
      itens: carrinho,
      total: carrinho.reduce((s, i) => s + i.valor * i.quantidade, 0),
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

/* =====================================================
   AUTO LOAD
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("listaProdutos")) {
    carregarProdutos();
    document.getElementById("filtroTexto").oninput = renderProdutos;
    document.getElementById("filtroTipo").onchange = renderProdutos;
    document.getElementById("filtroModelo").onchange = renderProdutos;
  }
});
