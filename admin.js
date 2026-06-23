const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "Smart2026!";

const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");
const loginCard = document.getElementById("loginCard");
const painelAdmin = document.getElementById("painelAdmin");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuario = document.getElementById("usuarioAdmin").value.trim();
  const senha = document.getElementById("senhaAdmin").value;

  if (usuario !== ADMIN_USER || senha !== ADMIN_PASSWORD) {
    loginMsg.classList.remove("hidden");
    return;
  }

  loginMsg.classList.add("hidden");
  loginCard.classList.add("hidden");
  painelAdmin.classList.remove("hidden");
});
