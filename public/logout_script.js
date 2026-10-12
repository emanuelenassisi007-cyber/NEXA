document.addEventListener("DOMContentLoaded", async () => {
  const response = await fetch(`${API_URL}/api/auth/createAdmin`, {
    method: "GET",
    credentials: "include",
  });
  const data = await response.json();
  if (data.setup === true) {
    window.location.href = "/public/signin.html";
  }
});

const password = document.getElementById("password");
const password_error = document.getElementById("password-error");
const logout = document.getElementById("logout");
const container_error = document.querySelector(".container-error");
const error_text = document.getElementById("error-text");
const togglePasswordBtn = document.getElementById("togglePasswordBtn");

togglePasswordBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const currentIcon = togglePasswordBtn.querySelector("i, svg");

  if (password.type === "password") {
    password.type = "text";

    currentIcon.setAttribute("data-icon", "eye");
    currentIcon.className.baseVal = "svg-inline--fa fa-eye";
    currentIcon.className = "fa-solid fa-eye";
  } else {
    password.type = "password";
    currentIcon.setAttribute("data-icon", "eye-slash");
    currentIcon.className.baseVal = "svg-inline--fa fa-eye-slash";
    currentIcon.className = "fa-regular fa-eye-slash";
  }
});

const regex =
  /^[a-zA-Z0-9.!#\$%&'*+/=?^_{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

function validaPassword() {
  const passwordValue = password.value.trim();

  if (passwordValue.length < 8) {
    password_error.textContent =
      "La password deve contenere almeno 8 caratteri.";
    password_error.style.display = "block";
    return false;
  }
  if (!/[A-Z]/.test(passwordValue)) {
    password_error.textContent =
      "La password deve contenere almeno una letter maiuscola.";
    password_error.style.display = "block";
    return false;
  }
  if (!/[a-z]/.test(passwordValue)) {
    password_error.textContent =
      "La password deve contenere almeno una lettera minuscola.";
    password_error.style.display = "block";
    return false;
  }
  if (!/\d/.test(passwordValue)) {
    password_error.textContent = "La password deve contenere almeno un numero.";
    password_error.style.display = "block";
    return false;
  }
  if (!/[!@#$%^&*()_+=\-[\]{};':",./?]/.test(passwordValue)) {
    password_error.textContent =
      "La password deve contenere almeno un carattere speciale (es. !@#$).";
    password_error.style.display = "block";
    return false;
  }

  password_error.textContent = "";
  password_error.style.display = "none";
  return true;
}

password.addEventListener("input", validaPassword);
let tempUserId = null;

logout.addEventListener("click", (e) => {
  e.preventDefault();
  if (!password.value.trim()) {
    container_error.classList.add("active");
    error_text.textContent = "Il campo password è obbligatorio";
    return false;
  }
  const isPasswordValida = validaPassword();

  container_error.classList.remove("active");
  container_error.classList.remove("success");
  error_text.textContent = "";

  if (!isPasswordValida) {
    container_error.classList.add("active");
    error_text.textContent = "Correggi gli errori prima di inviare";
    return false;
  }

  const data = {
    password: password.value.trim(),
  };

  fetch("/api/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Errore del server: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      container_error.classList.add("active");
      container_error.classList.add("success");
      error_text.textContent =
        "Logout completato con successo. A breve verrai reindirizzato alla pagina iniziale.";

      setTimeout(() => {
        window.location.replace("/public/login.html");
      }, 6000);
    })
    .catch((error) => {
      console.error("Si è verificato un problema:", error);
      container_error.classList.add("active");
      error_text.textContent = error.message;
      return false;
    });
});
