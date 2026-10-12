const queryParams = new URLSearchParams(window.location.search);
const tempUserId = queryParams.get("tempUserId");
const login = document.getElementById("login");
const check = document.getElementById("check");
const container_error = document.querySelector(".container-error");
const error_text = document.getElementById("error-text");

if (!tempUserId) {
  alert("Sessione non valida. Torna alla pagina di login");
  window.location.href = "/public/login.html";
}

document
  .getElementById("btn-submit-2fa")
  .addEventListener("click", async function () {
    const token = document.getElementById("login-2fa-code").value;

    if (!token || token.length !== 6) {
      container_error.classList.add("active");
      container_error.classList.remove("success");
      error_text.textContent = "Inserisci un codice valido di 6 cifre";
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/login-verify2FA`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: tempUserId, token: token }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        container_error.classList.add("active", "success");
        this.style.display = "none";
        document.querySelector(".spinner").style.display = "inline-block";
        error_text.innerHTML = `
          <span>Login effettuato! Reindirizzamento in corso...</span>
        `;

        if (data.full_name) {
          localStorage.setItem("nome", data.full_name);
        }

        setTimeout(() => {
          window.location.replace("/public/dashboard.html");
        }, 5000);
      } else {
        container_error.classList.add("active");
        container_error.classList.remove("success");
        error_text.textContent = data.error || "Codice errato. Riprovare.";
      }
    } catch (error) {
      console.error("Errore durante la verifica 2FA:", error);
      container_error.classList.add("active");
      container_error.classList.remove("success");
      error_text.textContent =
        "Si è verificato un problema di rete durante la verifica. Riprova piu tardi";
    }
  });
