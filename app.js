import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "Smart2026!";
const COLLECTION_NAME = "arraia_smart_2026";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const $ = (id) => document.getElementById(id);

const rsvpForm = $("rsvpForm");
const msg = $("msg");
const levaAcompanhante = $("levaAcompanhante");
const boxAcompanhantes = $("boxAcompanhantes");
const qtdAcompanhantes = $("qtdAcompanhantes");

const areaConfirmacao = $("areaConfirmacao");
const btnAreaOrganizacao = $("btnAreaOrganizacao");
const loginCard = $("loginCard");
const loginForm = $("loginForm");
const loginMsg = $("loginMsg");
const btnVoltarLogin = $("btnVoltarLogin");

const painelAdmin = $("painelAdmin");
const btnSair = $("btnSair");
const btnExportar = $("btnExportar");
const btnVoltarConfirmacao = $("btnVoltarConfirmacao");

let unsubscribe = null;
let linhas = [];

function mostrar(el) { el.classList.remove("hidden"); }
function esconder(el) { el.classList.add("hidden"); }

function mostrarConfirmacao() {
  mostrar(areaConfirmacao);
  esconder(loginCard);
  esconder(painelAdmin);
}

function mostrarLogin() {
  esconder(areaConfirmacao);
  mostrar(loginCard);
  esconder(painelAdmin);
}

function mostrarPainel() {
  esconder(areaConfirmacao);
  esconder(loginCard);
  mostrar(painelAdmin);
  iniciarPainel();
}

function safe(value) {
  return String(value ?? "").replace(/[&<>"]/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  }[ch]));
}

function formatDate(ts) {
  if (!ts || !ts.toDate) return "";
  return ts.toDate().toLocaleString("pt-BR");
}

levaAcompanhante.addEventListener("change", () => {
  if (levaAcompanhante.value === "Sim") {
    mostrar(boxAcompanhantes);
    qtdAcompanhantes.required = true;
  } else {
    esconder(boxAcompanhantes);
    qtdAcompanhantes.required = false;
    qtdAcompanhantes.value = 0;
  }
});

rsvpForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = $("btnEnviar");
  btn.disabled = true;
  btn.textContent = "Enviando...";

  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      nome: $("nome").value.trim(),
      participa: $("participa").value,
      obra: $("obra").value.trim(),
      levaAcompanhante: $("levaAcompanhante").value,
      qtdAcompanhantes: Number($("qtdAcompanhantes").value || 0),
      telefone: $("telefone").value.trim(),
      observacoes: $("observacoes").value.trim(),
      criadoEm: serverTimestamp()
    });

    msg.textContent = "Presença registrada com sucesso!";
    msg.className = "msg success";
    rsvpForm.reset();
    esconder(boxAcompanhantes);
  } catch (error) {
    console.error(error);
    msg.textContent = "Erro ao confirmar. Tente novamente ou avise a organização.";
    msg.className = "msg error";
  } finally {
    btn.disabled = false;
    btn.textContent = "Confirmar presença";
  }
});

btnAreaOrganizacao.addEventListener("click", mostrarLogin);
btnVoltarLogin.addEventListener("click", mostrarConfirmacao);
btnVoltarConfirmacao.addEventListener("click", mostrarConfirmacao);

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const usuario = $("usuarioAdmin").value.trim();
  const senha = $("senhaAdmin").value;

  if (usuario === ADMIN_USER && senha === ADMIN_PASSWORD) {
    sessionStorage.setItem("arraiaSmartAdmin", "ok");
    esconder(loginMsg);
    mostrarPainel();
  } else {
    mostrar(loginMsg);
  }
});

btnSair.addEventListener("click", () => {
  sessionStorage.removeItem("arraiaSmartAdmin");
  if (unsubscribe) unsubscribe();
  unsubscribe = null;
  mostrarConfirmacao();
});

function render(docs) {
  linhas = docs.map((d) => ({ id: d.id, ...d.data() }));

  const confirmados = linhas.filter((x) => x.participa === "Sim");
  const acompanhantes = confirmados.reduce((acc, x) => acc + Number(x.qtdAcompanhantes || 0), 0);

  $("totalConfirmados").textContent = confirmados.length;
  $("totalAcompanhantes").textContent = acompanhantes;
  $("totalGeral").textContent = confirmados.length + acompanhantes;

  $("tbody").innerHTML = linhas.map((x) => `
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

function iniciarPainel() {
  if (unsubscribe) return;

  const q = query(collection(db, COLLECTION_NAME), orderBy("criadoEm", "desc"));
  unsubscribe = onSnapshot(q, (snap) => {
    render(snap.docs);
  }, (error) => {
    console.error(error);
    $("tbody").innerHTML = `<tr><td colspan="6">Erro ao carregar dados.</td></tr>`;
  });
}

btnExportar.addEventListener("click", () => {
  const header = ["Nome", "Participa", "Obra", "Leva acompanhante", "Qtd acompanhantes", "Telefone", "Observações", "Data"];
  const rows = linhas.map((x) => [
    x.nome || "",
    x.participa || "",
    x.obra || "",
    x.levaAcompanhante || "",
    x.qtdAcompanhantes || 0,
    x.telefone || "",
    x.observacoes || "",
    formatDate(x.criadoEm)
  ]);

  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "confirmados-arraia-smart-2026.csv";
  a.click();

  URL.revokeObjectURL(url);
});

if (sessionStorage.getItem("arraiaSmartAdmin") === "ok") {
  mostrarPainel();
}
