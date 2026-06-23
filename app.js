import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("rsvpForm");
const msg = document.getElementById("msg");
const levaAcompanhante = document.getElementById("levaAcompanhante");
const boxAcompanhantes = document.getElementById("boxAcompanhantes");
const qtdAcompanhantes = document.getElementById("qtdAcompanhantes");

levaAcompanhante.addEventListener("change", () => {
  const sim = levaAcompanhante.value === "Sim";
  boxAcompanhantes.classList.toggle("hidden", !sim);
  qtdAcompanhantes.value = sim ? (qtdAcompanhantes.value === "0" ? 1 : qtdAcompanhantes.value) : 0;
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("btnEnviar");
  btn.disabled = true;
  btn.textContent = "Enviando...";

  const data = {
    nome: document.getElementById("nome").value.trim(),
    participa: document.getElementById("participa").value,
    obra: document.getElementById("obra").value.trim(),
    levaAcompanhante: levaAcompanhante.value,
    qtdAcompanhantes: Number(qtdAcompanhantes.value || 0),
    telefone: document.getElementById("telefone").value.trim(),
    observacoes: document.getElementById("observacoes").value.trim(),
    criadoEm: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "arraia_smart_2026"), data);
    form.reset();
    boxAcompanhantes.classList.add("hidden");
    msg.className = "msg success";
    msg.innerHTML = "🎉 <strong>Presença registrada!</strong><br>Obrigado por confirmar sua participação no Arraiá do Smart 2026.";
  } catch (err) {
    msg.className = "msg error";
    msg.textContent = "Não foi possível salvar agora. Confira a configuração do Firebase.";
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = "Confirmar presença";
  }
});
