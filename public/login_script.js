const check = document.getElementById("check");
document.addEventListener("DOMContentLoaded", async () => {
  const response = await fetch(`${API_URL}/api/auth/createAdmin`, {
    method: "GET",
    credentials: "include",
  });
  const data = await response.json();
  if (data.setup === true) {
    window.location.href = "/public/signin.html";
  }
  const response2 = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!response2.ok) {
    return false;
  }

  const data2 = await response2.json();
  const rememberMe = data2.user.rememberMe;

  if (rememberMe) {
    check.checked = true;
  } else {
    check.checked = false;
  }
  return data.authenticated === true;
});

const email = document.getElementById("email");
const password = document.getElementById("password");
const email_error = document.getElementById("email-error");
const password_error = document.getElementById("password-error");
const login = document.getElementById("login");

const container_error = document.querySelector(".container-error");
const error_text = document.getElementById("error-text");
const togglePasswordBtn = document.getElementById("togglePasswordBtn");

document.getElementById("forgot").addEventListener("click", (e) => {
  window.location.href = "/public/forgot.html";
  localStorage.setItem("provenienza", "login");
});

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

document.addEventListener("DOMContentLoaded", (e) => {
  e.preventDefault();
  const savedEmail = localStorage.getItem("email");
  if (savedEmail) email.value = savedEmail;
});

const regex =
  /^[a-zA-Z0-9.!#\$%&'*+/=?^_{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

function validaEmail() {
  const value = email.value.trim();

  if (value === "") {
    email_error.textContent = "Il campo email non può essere vuoto.";
    email_error.style.display = "block";
    return false;
  } else if (!regex.test(value)) {
    email_error.textContent =
      "Inserisci un indirizzo email valido (es. you@company.com).";
    email_error.style.display = "block";
    return false;
  } else {
    email_error.textContent = "";
    email_error.style.display = "none";
    return true;
  }
}
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

email.addEventListener("input", validaEmail);
password.addEventListener("input", validaPassword);
let tempUserId = null;

login.addEventListener("click", (e) => {
  e.preventDefault();
  if (!email.value.trim() || !password.value.trim()) {
    container_error.classList.add("active");
    error_text.textContent = "I campi email e password sono obbligatori";
    return false;
  }
  const isEmailValida = validaEmail();
  const isPasswordValida = validaPassword();

  container_error.classList.remove("active");
  container_error.classList.remove("success");
  error_text.textContent = "";

  if (!isEmailValida || !isPasswordValida) {
    container_error.classList.add("active");
    error_text.textContent = "Correggi gli errori prima di inviare";
    return false;
  }

  if (check.checked) {
    localStorage.setItem("email", email.value);
  } else {
    localStorage.removeItem("email");
  }

  const remember = document.getElementById("check").checked;

  const data = {
    email: email.value.trim(),
    password: password.value.trim(),
    rememberMe: remember,
  };

  fetch("http://localhost:3000/api/auth/login", {
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
      if (data.richiede2FA) {
        tempUserId = data.userId;
        window.location.replace(
          `/public/login2FA.html?tempUserId=${tempUserId}`,
        );
      } else {
        container_error.classList.add("active");
        container_error.classList.add("success");
        document.getElementById("check").checked = true;
        error_text.textContent =
          "Login completato con successo. Reindirizzamento...";

        if (data.full_name) localStorage.setItem("nome", data.full_name);
        window.location.replace("/public/dashboard.html");
      }
    })
    .catch((error) => {
      console.error("Si è verificato un problema:", error);
      container_error.classList.add("active");
      error_text.textContent = error.message;
      return false;
    });
});
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
        alert("Login effettuato con successo con 2FA!");
        if (data.full_name) localStorage.setItem("nome", data.full_name);
        window.location.replace("/public/dashboard.html");
      } else {
        alert(data.error || "Codice errato. Riprova.");
      }
    } catch (error) {
      console.error("Errore durante la verifica 2FA:", error);
      alert("Si è verificato un errore di rete durante la verifica.");
    }
  });
