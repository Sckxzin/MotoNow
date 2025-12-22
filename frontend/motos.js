const API = "https://motonow-production.up.railway.app";
const token = localStorage.getItem("token");

if (!token) {
  alert("Sessão expirada");
  window.location.href = "index.html";
}

/* ===============================
   CARREGAR MOTOS
=============================== */
async function carregarMotos() {
  try {
    const res = await fetch(`${API}/motos`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const motos = await res.json();

    const tbody = document.getElementById("listaMotos");
    tbody.innerHTML = "";

    motos.forEach(m => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${m.cidade}</td>
        <td>${m.modelo}</td>
        <td>${m.cor}</td>
        <td>${m.chassi}</td>
        <td>${m.santander}</td>
        <td>${m.data_entrada || ""}</td>
        <td>
          <button onclick="venderMoto(${m.id})">
            Vender
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar motos");
  }
}

/* ===============================
   VENDER MOTO
=============================== */
async function venderMoto(motoId) {
  const vendaId = prompt("Informe o ID da venda:");

  if (!vendaId) return;

  try {
    const res = await fetch(`${API}/motos/${motoId}/vender`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ venda_id: vendaId })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Erro ao vender moto");
      return;
    }

    alert("Moto vendida com sucesso");
    carregarMotos(); // some da lista

  } catch (err) {
    console.error(err);
    alert("Erro ao vender moto");
  }
}

/* ===============================
   VOLTAR
=============================== */
function voltar() {
  window.location.href = "app.html";
}

carregarMotos();
