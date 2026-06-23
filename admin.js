import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "Smart2026!";

const loginCard = document.getElementById("loginCard");
const painelAdmin = document.getElementById("painelAdmin");
const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");
const btnSair = document.getElementById("btnSair");
let unsubscribe = null;
let linhas = [];

function estaLogado(){ return sessionStorage.getItem("arraiaSmartAdmin") === "ok"; }
function abrirPainel(){
  loginCard.classList.add("hidden");
  painelAdmin.classList.remove("hidden");
  iniciarFirestore();
}
function sair(){
  sessionStorage.removeItem("arraiaSmartAdmin");
  if (unsubscribe) unsubscribe();
  painelAdmin.classList.add("hidden");
  loginCard.classList.remove("hidden");
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const usuario = document.getElementById("usuarioAdmin").value.trim();
  const senha = document.getElementById("senhaAdmin").value;
  if (usuario === ADMIN_USER && senha === ADMIN_PASSWORD) {
    sessionStorage.setItem("arraiaSmartAdmin", "ok");
    loginMsg.classList.add("hidden");
    abrirPainel();
  } else {
    loginMsg.classList.remove("hidden");
  }
});

btnSair.addEventListener("click", sair);

function formatDate(ts) {
  if (!ts || !ts.toDate) return "";
  return ts.toDate().toLocaleString("pt-BR");
}

function safe(value) {
  return String(value ?? "").replace(/[&<>"]/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;",""":"&quot;"}[ch]));
}

function render(docs) {
  linhas = docs.map(d => ({ id: d.id, ...d.data() }));
  const confirmados = linhas.filter(x => x.participa === "Sim");
  const acompanhantes = confirmados.reduce((acc, x) => acc + Number(x.qtdAcompanhantes || 0), 0);

  document.getElementById("totalConfirmados").textContent = confirmados.length;
  document.getElementById("totalAcompanhantes").textContent = acompanhantes;
  document.getElementById("totalGeral").textContent = confirmados.length + acompanhantes;

  document.getElementById("tbody").innerHTML = linhas.map(x => `
    <tr>
      <td>${safe(x.nome)}</td>
      <td>${safe(x.participa)}</td>
      <td>${safe(x.obra)}</td>
      <td>${Number(x.qtdAcompanhantes || 0)}</td>
      <td>${safe(x.telefone)}</td>
      <td>${safe(formatDate(x.criadoEm))}</td>
    </tr>
  `).join("");
}

function iniciarFirestore(){
  if (unsubscribe) return;
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const q = query(collection(db, "arraia_smart_2026"), orderBy("criadoEm", "desc"));
  unsubscribe = onSnapshot(q, snap => render(snap.docs));
}

document.getElementById("btnExportar").addEventListener("click", () => {
  const header = ["Nome", "Participa", "Obra", "Leva acompanhante", "Qtd acompanhantes", "Telefone", "Observações", "Data"];
  const rows = linhas.map(x => [
    x.nome || "", x.participa || "", x.obra || "", x.levaAcompanhante || "", x.qtdAcompanhantes || 0,
    x.telefone || "", x.observacoes || "", formatDate(x.criadoEm)
  ]);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(";")).join("
");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "confirmados-arraia-smart-2026.csv";
  a.click();
  URL.revokeObjectURL(url);
});

if (estaLogado()) abrirPainel();
