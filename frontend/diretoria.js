const API = "https://motonow-production.up.railway.app";

let vendas = [];

// ===============================
// SEGURANÇA
// ===============================
function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

// ===============================
// CARREGAR VENDAS
// ===============================
async function carregarVendas() {
  const token = localStorage.getItem("token");
  if (!token) return logout();

  const res = await fetch(`${API}/vendas`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401 || res.status === 403) {
    return logout();
  }

  vendas = await res.json();
  renderVendas();
}

// ===============================
// RENDER
// ===============================
function renderVendas() {
  const tbody = document.getElementById("listaVendas");
  tbody.innerHTML = "";

  const filial = document.getElementById("filtroFilial").value;
  const data = document.getElementById("filtroData").value;

  vendas
    .filter(v => !filial || v.filial === filial)
    .filter(v => {
      if (!data) return true;
      return v.created_at.startsWith(data);
    })
    .forEach(v => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(v.created_at).toLocaleString("pt-BR")}</td>
        <td>${v.filial}</td>
        <td>${v.cliente_nome || "-"}</td>
        <td>${v.forma_pagamento}</td>
        <td><b>${Number(v.total).toFixed(2)}</b></td>
      `;
      tbody.appendChild(tr);
    });
}

// ===============================
// AUTO LOAD
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  carregarVendas();

  document.getElementById("filtroFilial").onchange = renderVendas;
  document.getElementById("filtroData").onchange = renderVendas;
});
