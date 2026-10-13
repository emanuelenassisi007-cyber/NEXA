const activeLink = document.getElementById("active");
const current = document.getElementById("current_section");
const navigation = document.getElementById("navigation");
const name = document.getElementById("name");
const surname = document.getElementById("surname");
const griglia = document.getElementById("users");
const search_user = document.getElementById("search-input");
const clearFilters = document.getElementById("clear-filters");
const typeCategory = document.getElementById("typeCategory");
const type = document.getElementById("type");
const pagination = document.getElementById("pagination");
const addUser = document.getElementById("add-user");
const deleteUserBtn = document.getElementById("delete-user");
const deleteUser = document.getElementById("delete_user");
const deleteUser_btn = document.getElementById("deleteUser");
const dialog = document.getElementById("addUser");
const closeDialog = document.getElementById("close-dialog");
const closeDialogPass = document.getElementById("close-dialogPass");
const closeDialogDelete = document.getElementById("close-dialogDelete");
const saveUsers = document.getElementById("saveUser");
const savePassword = document.getElementById("savePass");
const error_form = document.getElementById("error-form");
const container_error = document.querySelector(".container-error");
const error_formDeleteDialog = document.getElementById(
  "error-formDialogDelete",
);
const container_errorDeleteDialog = document.querySelector(
  ".container-errorDialogDelete",
);
const error_formAddDialog = document.getElementById("error-formAddUser");
const container_errorAddDialog = document.querySelector(
  ".container-errorAddUser",
);
const errorContainerPass = document.querySelector(
  "#addPassword .container-error",
);
const errorTextPass = document.querySelector("#addPassword #error-form");
const cancel = document.getElementById("cancel");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const cancelPassword = document.getElementById("cancelDialog");
const fullName = document.getElementById("full_name");
const email = document.getElementById("email");
const selectedRadio = document.querySelector('input[name="userRole"]:checked');
const dialogPassword = document.getElementById("addPassword");
const textPassword = document.getElementById("password");
const createPasswordbtn = document.getElementById("createPassword");
const btnCopy = document.getElementById("btnCopy");
const sendEmail = document.getElementById("sendEmail");

const notificationBtn = document.getElementById("notification-btn");
const notificationDropdown = document.getElementById("notification-dropdown");
const notificationList = document.getElementById("notification-list");
const notificationBadge = document.getElementById("notification-badge");
const leggiTutto = document.getElementById("readAll");

const themeToggle = document.getElementById("themeToggle");
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark-mode");
  themeToggle.innerHTML = `<i class="fa-regular fa-sun" style="color: #686868"></i>`;
} else {
  themeToggle.innerHTML = `<i class="fa-regular fa-moon" style="color: #686868"></i>`;
}

themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark-mode");

  const isDark = document.documentElement.classList.contains("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.innerHTML = isDark
    ? `<i class="fa-regular fa-sun" style="color: #686868"></i>`
    : `<i class="fa-regular fa-moon" style="color: #686868"></i>`;
});

async function gestisciDatiProtetti() {
  const autenticato = await checkAuth();

  const elementi = document.querySelectorAll(".protected-data");
  const users = document.getElementById("users");

  if (!autenticato) {
    elementi.forEach((elemento) => {
      users.style.display = "flex";
      users.style.justifyContent = "center";
      elemento.style.justifyContent = "center";
      elemento.innerHTML = `<i class="fa-solid fa-lock"></i>`;
      addUser.style.pointerEvents = "none";
      addUser.style.opacity = "0.5";
    });
    container_error.classList.add("active");
    container_error.classList.remove("success");
    error_form.style.display = "block";
    error_form.textContent = "Accedi per visualizzare i dati della pagina";
  }
}
async function checkAuth() {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    return data.authenticated === true;
  } catch (error) {
    console.error("Errore controllo autenticazione:", error);
    return false;
  }
}
async function getCurrentUser() {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return data.user;
  } catch (error) {
    console.error("Errore recupero utente:", error);
    return null;
  }
}
async function mostraProfilo() {
  const user = await getCurrentUser();

  const name = document.getElementById("name");
  const surname = document.getElementById("surname");
  const nameComplete = document.getElementById("nameComplete");
  const surnameComplete = document.getElementById("surnameComplete");
  const imgElement = document.getElementById("avatar-img");

  if (user) {
    if (user.avatar) {
      const baseUrl = window.location.origin;
      imgElement.src = /^https?:\/\//i.test(user.avatar)
        ? user.avatar
        : baseUrl + user.avatar;
      imgElement.style.display = "block";
      name.style.display = "none";
      surname.style.display = "none";
    } else {
      imgElement.style.display = "none";
      name.style.display = "block";
      surname.style.display = "block";
    }
    const partiNome = user.full_name.trim().split(" ");
    name.textContent = partiNome[0]?.charAt(0).toUpperCase() || "";
    surname.textContent = partiNome[1]?.charAt(0).toUpperCase() || "";
    nameComplete.textContent = user.full_name.trim().split(" ")[0];
    surnameComplete.textContent = user.full_name.trim().split(" ")[1];
  } else {
    name.innerHTML = `
            <i class="fa-solid fa-user" style="color: #635BFF; font-size:13px"></i>
        `;
  }
}
async function mostraPulsantiAdmin(passwordCliccata) {
  const user = await getCurrentUser();

  if (user) {
    if (user && user.role?.toUpperCase() === "ADMIN") {
      passwordCliccata.style.display = "flex";
    } else {
      passwordCliccata.style.display = "none";
    }
  } else {
  }
}
async function gestisciPulsantiAdmin() {
  const user = await getCurrentUser();

  const colonnaPassword = document.getElementById("password-column");

  if (!colonnaPassword) return;

  if (user && user.role?.toUpperCase() === "ADMIN") {
    colonnaPassword.style.display = "";
    addUser.style.display = "flex";
    deleteUserBtn.style.display = "flex";
  } else {
    colonnaPassword.style.display = "none";
    addUser.style.display = "none";
    deleteUserBtn.style.display = "none";
  }
}

notificationBtn.addEventListener("click", (e) => {
  notificationDropdown.classList.toggle("show");

  if (notificationDropdown.classList.contains("show")) {
    loadNotification();
  }
});
leggiTutto.addEventListener("click", async () => {
  try {
    const response = await fetch(`${API_URL}/api/auth/setReadAll`, {
      method: "PATCH",
      credentials: "include",
    });
    const data = await response.json();
    if (data.success) {
      notificationList.innerHTML =
        '<li class="empty-message">Nessuna nuova notifica</li>';
      notificationBadge.style.display = "none";
    }
  } catch (error) {
    console.error("Errore durante l'aggiornamento della notifica:", error);
  }
});
document.addEventListener("click", (e) => {
  const clickSuBottone = notificationBtn.contains(e.target);
  const clickDentroDropdown = notificationDropdown.contains(e.target);

  if (!clickSuBottone && !clickDentroDropdown) {
    notificationDropdown.classList.remove("show");
  }
});
async function loadNotification() {
  try {
    const response = await fetch(`${API_URL}/api/auth/getNotifications`, {
      credentials: "include",
      method: "GET",
    });

    const data = await response.json();
    notificationList.innerHTML = "";

    const notificheNonLette = data.filter((notif) => notif.is_read === 0);

    if (notificheNonLette.length === 0) {
      notificationList.innerHTML =
        '<li class="empty-message">Nessuna nuova notifica</li>';
      notificationBadge.style.display = "none";
      return;
    }

    notificationBadge.textContent = notificheNonLette.length;
    notificationBadge.style.display = "inline-block";

    notificheNonLette.forEach((notif) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span style="font-size: 13px; font-weight: bold">${notif.type.toUpperCase()}</span>:
        <br> ${notif.message}
        <div style="font-size: 10px; color: grey; margin-top: 4px;">
          ${new Date(notif.created_at).toLocaleString()}
        </div>
      `;
      notificationList.appendChild(li);
    });
  } catch (error) {
    console.error("Errore nel caricamento delle notifiche:", error);
  }
}

let socket;

window.addEventListener("load", () => {
  loadNotification();
  if (typeof io === "undefined") {
    console.error("❌ Socket.IO non è stato caricato.");
    return;
  }

  socket = io(API_URL, {
    withCredentials: true,
  });

  socket.on("connect", () => {});

  socket.on("disconnect", (reason) => {});

  socket.on("connect_error", (error) => {
    console.error("❌ SOCKET ERROR:", error.message);
  });

  socket.on("nuova_notifica", (notifica) => {
    loadNotification();
  });
  socket.on("users_active", (notifica) => {
    getUsers();
  });
  socket.on("users_add", (notifica) => {
    getUsers();
  });
  socket.on("users_delete", (notifica) => {
    getUsers();
  });
  socket.on("nuova_notifica", (notifica) => {
    if (typeof Toastify !== "undefined") {
      const divNotifica = document.createElement("div");

      divNotifica.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; gap: 16px; min-width: 70%;">
          <div style="display: flex; align-items: center; gap: 12px">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(16, 185, 129, 0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg xmlns="http://w3.org" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div style="text-align: left;">
              <span style="font-size: 13px; font-weight: 600; color: var(--text-color); display: block; text-transform: capitalize; margin-bottom: 2px;">
                ${notifica.type}
              </span>
              <span style="font-size: 11px; color: grey; font-weight: 500; display: block; line-height: 1.4;">
                ${notifica.message}
              </span>
            </div>
          </div>
        </div>
      `;
      const istanzaToast = Toastify({
        node: divNotifica,
        duration: 4000,
        gravity: "top",
        position: "center",
        stopOnFocus: true,
        style: {
          borderRadius: "12px",
          background: "var(--surface-color)",
          padding: "16px 20px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
          fontFamily: "Arial, Helvetica, sans-serif",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          width: "100%",
        },
      }).showToast();
    }

    const li = document.createElement("li");
    li.innerHTML = `
      <span style="font-size: 13px; font-weight: bold">${notifica.type.toUpperCase()}</span>:
      <br> ${notifica.message}
      <div style="font-size: 10px; color: grey; margin-top: 4px;">
        ${new Date().toLocaleString()}
      </div>
    `;

    const emptyMsg = notificationList.querySelector(".empty-message");
    if (emptyMsg) emptyMsg.remove();

    notificationList.insertBefore(li, notificationList.firstChild);

    const currentCount = parseInt(notificationBadge.textContent) || 0;
    notificationBadge.textContent = currentCount + 1;
    notificationBadge.style.display = "inline-block";
  });
});

gestisciDatiProtetti();
getCurrentUser();
mostraProfilo();
loadNotification();
checkAuth();
gestisciPulsantiAdmin();

const regex =
  /^[a-zA-Z0-9.!#\$%&'*+/=?^_{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
let statusUser = "";
let valoreCliccato = "";

btnCopy.addEventListener("click", async () => {
  const passwordDaCopiare = textPassword.textContent;
  if (passwordDaCopiare.includes("*") || passwordDaCopiare === "") {
    errorContainerPass.classList.add("active");
    errorContainerPass.classList.remove("success");
    errorTextPass.style.display = "block";
    errorTextPass.textContent = "Per copiare devi prima generare una password";
    return;
  }
  const iconaCopia = `
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
`;
  const iconaCheck = `
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
`;
  try {
    await navigator.clipboard.writeText(passwordDaCopiare);

    btnCopy.style.background = "#4CAF50";
    btnCopy.innerHTML = iconaCheck;

    setTimeout(() => {
      btnCopy.style.background = "";
      btnCopy.innerHTML = iconaCopia;

      errorContainerPass.classList.remove("active", "success");
      errorTextPass.style.display = "none";
    }, 2000);
  } catch (err) {
    console.error("Impossibile copiare il testo: ", err);
    errorContainerPass.classList.add("active");
    errorContainerPass.classList.remove("success");
    errorTextPass.style.display = "block";
    errorTextPass.textContent = "Errore durante la copia";
  }
});

cancel.addEventListener("click", () => {
  fullName.value = "";
  email.value = "";
  error_form.textContent = "";
  error_form.style.display = "none";
  container_error.classList.remove("active");
  container_error.classList.remove("success");
  dialog.close();
});

cancelDeleteBtn.addEventListener("click", () => {
  document.getElementById("full_nameDelete").value = "";
  document.getElementById("emailDelete").value = "";
  error_formDeleteDialog.textContent = "";
  error_formDeleteDialog.style.display = "none";
  container_errorDeleteDialog.classList.remove("active");
  container_errorDeleteDialog.classList.remove("success");
  deleteUser.close();
});
cancelPassword.addEventListener("click", () => {
  textPassword.textContent = "* * * * * * * * *";
  textPassword.style.letterSpacing = "0.11em";
  dialogPassword.close();
});

closeDialogPass.addEventListener("click", () => {
  textPassword.textContent = "* * * * * * * * *";
  textPassword.style.letterSpacing = "0.11em";
  dialogPassword.close();
});

dialogPassword.addEventListener("click", (event) => {
  const rect = dialogPassword.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  ) {
    dialogPassword.close();
  }
});

async function createPassword() {
  const response = await fetch(`${API_URL}/api/auth/createPassword`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) return;
  const data = await response.json();
  if (!data || !data.password) {
    textPassword.textContent = "**********";
    return false;
  }
  const password = data.password;
  textPassword.textContent = password;
  textPassword.style.letterSpacing = "0.15em";
}

createPasswordbtn.addEventListener("click", createPassword);

function validaEmail(valoreCliccato) {
  if (!fullName.value.trim() || !email.value.trim() || !valoreCliccato) {
    container_errorAddDialog.classList.add("active");
    container_errorAddDialog.classList.remove("success");
    error_formAddDialog.textContent = "Tutti i campi sono obbligatori.";
    error_foerror_formAddDialogrm.style.display = "block";
    return false;
  }
  const value = email.value.trim();

  if (!regex.test(value)) {
    container_errorAddDialog.classList.add("active");
    container_errorAddDialog.classList.remove("success");
    error_formAddDialog.textContent =
      "Inserisci un indirizzo email valido (es. you@company.com).";
    error_formAddDialog.style.display = "block";
    return false;
  } else {
    container_errorAddDialog.classList.remove("active");
    error_formAddDialog.textContent = "";
    error_formAddDialog.style.display = "none";
    return true;
  }
}
function validaEmailDelete(full_name, email) {
  if (!full_name.trim() || !email.trim()) {
    container_errorDeleteDialog.classList.add("active");
    container_errorDeleteDialog.classList.remove("success");
    error_formDeleteDialog.textContent = "Tutti i campi sono obbligatori.";
    error_formDeleteDialog.style.display = "block";
    return false;
  }
  const value = email.trim();

  if (!regex.test(value)) {
    container_errorDeleteDialog.classList.add("active");
    container_errorDeleteDialog.classList.remove("success");
    error_formDeleteDialog.textContent =
      "Inserisci un indirizzo email valido (es. you@company.com).";
    error_formDeleteDialog.style.display = "block";
    return false;
  } else {
    container_errorDeleteDialog.classList.remove("active");
    error_formDeleteDialog.textContent = "";
    error_formDeleteDialog.style.display = "none";
    return true;
  }
}

saveUsers.addEventListener("click", (e) => {
  e.preventDefault();
  const selectedRadio = document.querySelector(
    'input[name="userRole"]:checked',
  );
  const valoreCliccato = selectedRadio ? selectedRadio.value : "";

  if (!validaEmail(valoreCliccato)) {
    return;
  }

  const user = {
    name: fullName.value.trim(),
    email: email.value.trim(),
    role: valoreCliccato,
  };

  const testoOriginale = saveUsers.innerHTML;
  saveUsers.disabled = true;
  saveUsers.innerHTML = `Salvataggio...`;
  container_errorAddDialog.classList.add("active");
  container_errorAddDialog.classList.add("success");
  error_formAddDialog.style.display = "block";
  error_formAddDialog.innerHTML = `<span class="spinner"></span> Salvataggio dell'utente in corso...`;

  fetch(`${API_URL}/api/auth/addUser`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(user),
  })
    .then(async (response) => {
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errData = await response.json();
          throw new Error(
            errData.errore ||
              errData.message ||
              errData.error ||
              "Errore dal server",
          );
        } else {
          const textError = await response.text();
          console.error("Risposta HTML del server:", textError);
          throw new Error(
            `Errore interno del server (${response.status}). Controlla i log del backend.`,
          );
        }
      }
      return response.json();
    })
    .then((data) => {
      container_errorAddDialog.classList.add("active");
      container_errorAddDialog.classList.add("success");
      error_formAddDialog.style.display = "block";
      error_formAddDialog.textContent = "Nuovo utente registrato con successo";
      setTimeout(() => {
        dialog.close();
        error_formAddDialog.textContent = "";
        error_formAddDialog.style.display = "none";
        container_errorAddDialog.classList.remove("active");
        container_errorAddDialog.classList.remove("success");
      }, 2000);
      fullName.value = "";
      email.value = "";
      valoreCliccato.value = "";
      return false;
    })
    .catch((error) => {
      console.error("Si è verificato un problema:", error);
      container_errorAddDialog.classList.remove("success");
      container_errorAddDialog.classList.add("active");
      error_formAddDialog.textContent = error.message;
      error_formAddDialog.style.display = "block";
    })
    .finally(() => {
      saveUsers.disabled = false;
      saveUsers.innerHTML = testoOriginale;
    });
});
deleteUser_btn.addEventListener("click", (e) => {
  e.preventDefault();

  const email = document.getElementById("emailDelete").value;
  const fullName = document.getElementById("full_nameDelete").value;

  if (!validaEmailDelete(fullName, email)) {
    return;
  }

  const user = {
    name: fullName.trim(),
    email: email.trim(),
  };

  const testoOriginale = deleteUser_btn.innerHTML;
  deleteUser_btn.disabled = true;
  deleteUser_btn.innerHTML = `Eliminazione...`;
  container_errorDeleteDialog.classList.add("active");
  container_errorDeleteDialog.classList.add("success");
  error_formDeleteDialog.style.display = "block";
  error_formDeleteDialog.innerHTML = `<span class="spinner"></span> Eliminazione dell'utente in corso...`;

  fetch(`${API_URL}/api/auth/deleteUser`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(user),
  })
    .then(async (response) => {
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errData = await response.json();
          throw new Error(
            errData.errore ||
              errData.message ||
              errData.error ||
              "Errore dal server",
          );
        } else {
          const textError = await response.text();
          console.error("Risposta HTML del server:", textError);
          throw new Error(
            `Errore interno del server (${response.status}). Controlla i log del backend.`,
          );
        }
      }
      return response.json();
    })
    .then((data) => {
      container_errorDeleteDialog.classList.add("active");
      container_errorDeleteDialog.classList.add("success");
      error_formDeleteDialog.style.display = "block";
      error_formDeleteDialog.textContent = "Utente eliminato con successo";
      setTimeout(() => {
        deleteUser.close();
        error_formDeleteDialog.textContent = "";
        error_formDeleteDialog.style.display = "none";
        container_errorDeleteDialog.classList.remove("active");
        container_errorDeleteDialog.classList.remove("success");
      }, 2000);
      fullName.value = "";
      email.value = "";
      return false;
    })
    .catch((error) => {
      console.error("Si è verificato un problema:", error);
      container_errorDeleteDialog.classList.remove("success");
      container_errorDeleteDialog.classList.add("active");
      error_formDeleteDialog.textContent = error.message;
      error_formDeleteDialog.style.display = "block";
    })
    .finally(() => {
      deleteUser_btn.disabled = false;
      deleteUser_btn.innerHTML = testoOriginale;
    });
});

addUser.addEventListener("click", () => {
  if (dialog.open) {
    dialog.close();
  } else {
    dialog.showModal();
  }
});
deleteUserBtn.addEventListener("click", () => {
  if (deleteUser.open) {
    deleteUser.close();
  } else {
    deleteUser.showModal();
  }
});
closeDialog.addEventListener("click", () => {
  fullName.value = "";
  email.value = "";
  error_form.textContent = "";
  error_form.style.display = "none";
  container_error.classList.remove("active");
  dialog.close();
});
closeDialogDelete.addEventListener("click", () => {
  document.getElementById("full_nameDelete").value = "";
  document.getElementById("emailDelete").value = "";
  error_formDeleteDialog.textContent = "";
  error_formDeleteDialog.style.display = "none";
  container_errorDeleteDialog.classList.remove("active");
  deleteUser.close();
});

dialog.addEventListener("click", (event) => {
  const rect = dialog.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  ) {
    dialog.close();
  }
});
deleteUser.addEventListener("click", (event) => {
  const rect = deleteUser.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  ) {
    deleteUser.close();
  }
});

function resetFilters() {
  typeCategory.value = "All";
  type.value = "All";
  clearFilters.style.display = "none";
  search_user.value = "";
  getUsers("", "", "", 1);
}

if (activeLink) {
  const sectionName = activeLink.querySelector("span").innerText;
  current.innerText = sectionName;
  navigation.innerText = `Nexa > ${sectionName}`;
}

typeCategory.addEventListener("change", () => {
  const categoryType = typeCategory.value === "All" ? "" : typeCategory.value;
  const typeActive = type.value === "All" ? "" : type.value;
  getUsers(search_user.value, categoryType, typeActive);
  clearFilters.style.display = "block";
});
type.addEventListener("change", () => {
  const categoryType = typeCategory.value === "All" ? "" : typeCategory.value;
  const typeService = type.value === "All" ? "" : type.value;
  const typeActive = type.value === "All" ? "" : type.value;
  getUsers(search_user.value, categoryType, typeActive);
  clearFilters.style.display = "block";
});

clearFilters.addEventListener("click", resetFilters);
function createPageButton(page, currentPage) {
  return `
    <button
      class="${page === currentPage ? "active-page" : ""}"
      onclick="changePage(${page})"
    >
      ${page}
    </button>
  `;
}
function createPagination(currentPage, totalPages) {
  const pagination = document.getElementById("pagination");

  let html = "";

  html += `
    <button
      onclick="changePage(${currentPage - 1})"
      ${currentPage === 1 ? "disabled" : ""}
    >
      ‹
    </button>
  `;

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      html += createPageButton(i, currentPage);
    }
  } else {
    html += createPageButton(1, currentPage);

    if (currentPage > 4) {
      html += `<span class="pagination-dots">...</span>`;
    }

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 4) {
      start = 2;
      end = 5;
    }

    if (currentPage >= totalPages - 3) {
      start = totalPages - 4;
      end = totalPages - 1;
    }

    for (let i = start; i <= end; i++) {
      html += createPageButton(i, currentPage);
    }

    if (currentPage < totalPages - 3) {
      html += `<span class="pagination-dots">...</span>`;
    }

    html += createPageButton(totalPages, currentPage);
  }

  html += `
    <button
      onclick="changePage(${currentPage + 1})"
      ${currentPage === totalPages ? "disabled" : ""}
    >
      ›
    </button>
  `;

  pagination.innerHTML = html;
}
function changePage(page) {
  const categoryType = typeCategory.value === "All" ? "" : typeCategory.value;

  const typeActive = type.value === "All" ? "" : type.value;

  getUsers(search_user.value, categoryType, typeActive, page);
}
function getStatus(lastActivity) {
  if (!lastActivity) return "Inactive";
  if (Date.now() - new Date(lastActivity).getTime() < 5 * 60 * 1000) {
    return (statusUser = "Active");
  } else {
    return (statusUser = "Inactive");
  }
}
let utenteSelezionato = null;

function mostraMessaggioPass(testo, ok) {
  errorContainerPass.classList.add("active");
  errorContainerPass.classList.toggle("success", ok);
  errorTextPass.style.display = "block";
  errorTextPass.textContent = testo;

  if (ok) {
    setTimeout(() => {
      errorContainerPass.classList.remove("active", "success");
      errorTextPass.style.display = "none";
    }, 2000);
  }
}

async function inviaRichiestaPassword(
  bottone,
  endpoint,
  body,
  msgOk,
  msgErrore,
) {
  bottone.disabled = true; // impedisce il doppio clic
  try {
    const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Errore del server: ${response.status}`);
    await response.json();
    mostraMessaggioPass(msgOk, true);
  } catch (err) {
    console.error(msgErrore, err);
    mostraMessaggioPass("Errore durante l'operazione", false);
  } finally {
    bottone.disabled = false;
  }
}

function initPasswordDialog() {
  griglia.addEventListener("click", (event) => {
    const el = event.target.closest(".passUser");
    if (!el) return;
    utenteSelezionato = { email: el.dataset.email, name: el.dataset.name };
    if (dialogPassword.open) dialogPassword.close();
    else dialogPassword.showModal();
  });

  dialogPassword.addEventListener("close", () => {
    utenteSelezionato = null;
  });

  savePassword.addEventListener("click", () => {
    if (!utenteSelezionato) return;
    const password = textPassword.textContent;
    if (password.includes("*") || password === "") {
      mostraMessaggioPass("Genera una password prima di salvarla", false);
      return;
    }
    inviaRichiestaPassword(
      savePassword,
      "savePassword",
      { password, email: utenteSelezionato.email },
      "Password salvata con successo",
      "Impossibile salvare la password:",
    );
  });

  sendEmail.addEventListener("click", () => {
    if (!utenteSelezionato) return;
    const password = textPassword.textContent;
    if (password.includes("*") || password === "") {
      mostraMessaggioPass("Genera una password prima di inviarla", false);
      return;
    }
    inviaRichiestaPassword(
      sendEmail,
      "sendPassword",
      {
        password,
        email: utenteSelezionato.email,
        nome: utenteSelezionato.name,
      },
      "Password inviata con successo",
      "Impossibile inviare la password:",
    );
  });
}

async function getUsers(
  search = "",
  categoryType = "",
  typeActive = "",
  page = 1,
) {
  try {
    const response = await fetch(
      `${API_URL}/api/auth/getUsers?search=${encodeURIComponent(search)}&categoryType=${encodeURIComponent(categoryType)}&typeService=${typeActive}&page=${page}`,
      {
        credentials: "include",
      },
    );
    if (!response.ok) throw new Error("Errore del server");

    const data = await response.json();

    let tuttoLHtml = "";
    const currentUser = await getCurrentUser();

    const isAdmin = currentUser && currentUser.role?.toUpperCase() === "ADMIN";

    data.users.forEach((element) => {
      const statoUtente = getStatus(element.last_activity);
      const colorestato = () => {
        switch (statoUtente) {
          case "Active":
            return "#22C55E";
          case "Inactive":
            return "#FF0000";
          default:
            return "black";
        }
      };

      const name = element.name;
      const email = element.email;

      const role = element.role.toUpperCase();
      const isAdmin = currentUser?.role?.toUpperCase() === "ADMIN";
      const displayButton = isAdmin && role !== "ADMIN" ? "flex" : "none";
      let last_login = new Date(element.last_login).toLocaleDateString(
        "it-IT",
        {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        },
      );

      if (last_login === "01/01/1970, 01:00:00") {
        last_login = "-";
      }
      const partiNome = name.split(" ");

      const initNameCustomer = partiNome[0]?.charAt(0).toUpperCase() || "";

      const initSurnameCustomer = partiNome[1]?.charAt(0).toUpperCase() || "";

      const usersContainer = document.getElementById("users");

      if (isAdmin) {
        usersContainer.classList.add("admin-view");
        usersContainer.classList.remove("user-view");
      } else {
        usersContainer.classList.add("user-view");
        usersContainer.classList.remove("admin-view");
      }

      tuttoLHtml += `
          <div style = "display:flex; flex-direction:row; align-items:center; gap:7px;">
            <div class="profile">
              <span>${initNameCustomer}</span>
              <span>${initSurnameCustomer}</span>
            </div>
            <span style="font-size:12px; color:var(--text-color); font-weight:bold">${name}</span>
          </div>
           <span style="font-size:12px; color:grey; font-weight:normal; align-items:start">${email}</span>
          <span style="font-size:12px; color:blue; font-weight:bold">${role}</span>
          <span style="font-size:12px; color:${colorestato()}; font-weight:bold">${statoUtente}</span>
          <span style="font-size:12px; color:grey; font-weight:normal;">${last_login}</span>
          <div class="passUser" style="display:${displayButton}" data-email="${email}" data-name="${name}">
              <i class="fa-solid fa-user-lock" style="color: rgb(196, 157, 17);"></i>
          </div>
          <hr style="grid-column: span 6; border: none; height: 1px; background-color: rgb(225, 225, 230); margin: 5px 0; width: 100%;" />
          `;
    });
    createPagination(data.currentPage, data.totalPages);
    griglia.innerHTML = tuttoLHtml;
  } catch (error) {}
}
getUsers();

search_user.addEventListener("input", () => {
  const categoryType = typeCategory.value === "All" ? "" : typeCategory.value;
  const typeActive = type.value === "All" ? "" : type.value;
  getUsers(search_user.value, categoryType, typeActive);
  clearFilters.style.display = "block";
});
initPasswordDialog();
