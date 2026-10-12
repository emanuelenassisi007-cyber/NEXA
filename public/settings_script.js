document.body.style.overflow = "auto";
const activeLink = document.getElementById("active");
const current = document.getElementById("current_section");
const navigation = document.getElementById("navigation");
const name = document.getElementById("name");
const surname = document.getElementById("surname");
const light = document.getElementById("light");
const dark = document.getElementById("dark");
const storage = document.getElementById("storage");
const numberRecords = document.getElementById("numberRecords");
const collections = document.getElementById("collections");
const backupBtn = document.getElementById("backup");
const lastBackup = document.getElementById("lastBackup");
const exportsData = document.getElementById("exports-data");
const importData = document
  .getElementById("import-data")
  .addEventListener("click", () => {
    window.location.href = "/public/backups.html";
  });
const messageBackup = document.getElementById("messageBackup");
const error_form = document.getElementById("error-form");
const container_error = document.querySelector(".container-error");
const switchAuth = document.getElementById("switchAuth");
const switchBackup = document.getElementById("autoBackup");
const boxDatabase = document.getElementById("boxDatabase");
const boxGeneral = document.getElementById("boxGeneral");
const boxDangerous = document.getElementById("boxDangerous");
const saveChanges = document.getElementById("save");
const emailNotify = document.getElementById("emailNotify");
const exportMyData = document.getElementById("exportMyData");
const email_error = document.getElementById("email-error");
const emailInput = document.getElementById("control-email");
const btnConfirmed = document.getElementById("btn-confirm-enable");
const enableEmailNotify = document.getElementById("enableEmailNotify");
const initialsElement = document.getElementById("avatar-initials");
const imgElement = document.getElementById("avatar-img");
const imgElement2 = document.getElementById("avatar-img2");
const deleteWorkspace = document.getElementById("delete-workspace");
const deactive_account = document.getElementById("deactive-account");

const notifyOrders = document.getElementById("notifyOrders");
const notifyApp = document.getElementById("notifyApp");
const notifyCustomers = document.getElementById("notifyCustomers");
const notifyProducts = document.getElementById("notifyProducts");
const notifyUsers = document.getElementById("notifyUsers");
const password = document.getElementById("password");
const passwordDeactive = document.getElementById("deactivate-password");
const password_error = document.getElementById("password-error");
const password_error2 = document.getElementById("password-error2");

const error_formApp = document.getElementById("error-formApp");
const container_errorApp = document.querySelector(".container-errorApp");
const container_errorDelete = document.querySelector(
  ".container-errorDeleteCustomer",
);
const error_formDelete = document.getElementById("error-formDeleteCustomer");
const container_errorAdd = document.querySelector(".container-errorAddProduct");
const error_formAdd = document.getElementById("error-formAddProduct");
const container_errorDeactivate = document.querySelector(
  ".container-errorDeactivate",
);
const error_formDeactivate = document.getElementById("error-formDeactivate");

const notificationBtn = document.getElementById("notification-btn");
const notificationDropdown = document.getElementById("notification-dropdown");
const notificationList = document.getElementById("notification-list");
const notificationBadge = document.getElementById("notification-badge");
const leggiTutto = document.getElementById("readAll");
const boxPush = document.querySelector(".boxPush");
let initialsUser = "";

light.style.border = "2px solid blue";
const regex =
  /^[a-zA-Z0-9.!#\$%&'*+/=?^_{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

light.addEventListener("click", () => {
  document.documentElement.classList.remove("dark-mode");
  light.style.border = "2px solid blue";
  dark.style.border = "1px solid #dfe3ea";
  themeToggle.innerHTML = `<i class="fa-regular fa-moon" style="color: #686868"></i>`;
  localStorage.setItem("theme", "light");
});
dark.addEventListener("click", () => {
  document.documentElement.classList.add("dark-mode");
  light.style.border = "1px solid #dfe3ea";
  dark.style.border = "2px solid #8A83FF";
  themeToggle.innerHTML = `<i class="fa-regular fa-sun" style="color: #686868"></i>`;
  localStorage.setItem("theme", "dark");
});

const themeToggle = document.getElementById("themeToggle");
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark-mode");
  light.style.border = "1px solid #dfe3ea";
  dark.style.border = "2px solid #8A83FF";
  themeToggle.innerHTML = `<i class="fa-regular fa-sun" style="color: #686868"></i>`;
} else {
  light.style.border = "2px solid blue";
  dark.style.border = "1px solid #dfe3ea";
  themeToggle.innerHTML = `<i class="fa-regular fa-moon" style="color: #686868"></i>`;
}

themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark-mode");

  const isDark = document.documentElement.classList.contains("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  if (isDark) {
    themeToggle.innerHTML = `<i class="fa-regular fa-sun" style="color: #686868"></i>`;
    light.style.border = "1px solid #dfe3ea";
    dark.style.border = "2px solid #8A83FF";
  } else {
    themeToggle.innerHTML = `<i class="fa-regular fa-moon" style="color: #686868"></i>`;
    light.style.border = "2px solid blue";
    dark.style.border = "1px solid #dfe3ea";
  }
});

async function gestisciDatiProtetti() {
  const autenticato = await checkAuth();

  const elementi = document.querySelectorAll(".protected-data");
  const storage = document.getElementById("storage");
  const button = document.querySelectorAll(".button");

  if (!autenticato) {
    elementi.forEach((elemento) => {
      storage.style.display = "flex";
      storage.style.justifyContent = "center";
      elemento.style.justifyContent = "center";
      elemento.innerHTML = `<i class="fa-solid fa-lock" style="font-size: 24px"></i>`;
    });
    if (!autenticato) {
      button.forEach((element) => {
        element.style.pointerEvents = "none";
        element.style.opacity = "0.5";
      });
    }
    container_error.classList.add("active");
    container_error.classList.remove("success");
    error_form.style.display = "block";
    error_form.textContent = "Accedi per visualizzare i dati della pagina";
  }
}
let email = "";
async function checkAuth() {
  try {
    const response = await fetch("http://localhost:3000/api/auth/me", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    email = data.user.email;
    notifyOrders.checked = data.user.orders;
    notifyApp.checked = data.user.appointments;
    notifyCustomers.checked = data.user.customers;
    notifyProducts.checked = data.user.products;
    notifyUsers.checked = data.user.users;
    return data.authenticated === true;
  } catch (error) {
    console.error("Errore controllo autenticazione:", error);
    return false;
  }
}
async function isAdmin() {
  try {
    const response = await fetch("http://localhost:3000/api/auth/me", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    if (data.user?.role?.toUpperCase() !== "ADMIN") {
      boxDatabase.style.display = "none";
      boxGeneral.style.display = "none";
      boxDangerous.style.display = "none";
    }
  } catch (error) {
    console.error("Errore controllo autenticazione:", error);
    return false;
  }
}
async function getCurrentUser() {
  try {
    const response = await fetch("http://localhost:3000/api/auth/me", {
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
const firstName = document.getElementById("first_name");
const lastName = document.getElementById("last_name");
const emailUser = document.getElementById("email_user");
async function getDataUser() {
  try {
    const response = await fetch("http://localhost:3000/api/auth/me", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    const nome = data.user.full_name.split(" ")[0];
    const cognome = data.user.full_name.split(" ")[1];
    const email = data.user.email;

    document.getElementById("first_name").placeholder = nome;
    document.getElementById("last_name").placeholder = cognome;
    document.getElementById("email_user").placeholder = email;

    const removeAvatar = document.getElementById("remove-avatar");

    if (!data.user.avatar || typeof data.user.avatar === "NULL") {
      removeAvatar.style.opacity = "0.7";
      removeAvatar.style.pointerEvents = "none";
    } else {
      removeAvatar.style.opacity = "1";
      removeAvatar.style.pointerEvents = "auto";
    }
  } catch (error) {
    console.error("Errore recupero utente:", error);
    return null;
  }
}

firstName.addEventListener("input", controlButton);
lastName.addEventListener("input", controlButton);
emailUser.addEventListener("input", controlButton);

function controlButton() {
  const hasValue =
    firstName.value.trim() || lastName.value.trim() || emailUser.value.trim();

  if (!hasValue) {
    saveChanges.style.opacity = "0.3";
    saveChanges.style.pointerEvents = "none";
  } else {
    saveChanges.style.opacity = "1";
    saveChanges.style.pointerEvents = "auto";
  }
}

saveChanges.addEventListener("click", async (e) => {
  e.preventDefault();

  const nome =
    firstName.value.trim().charAt(0).toUpperCase() +
    firstName.value.trim().slice(1).toLowerCase();
  const cognome =
    lastName.value.trim().charAt(0).toUpperCase() +
    lastName.value.trim().slice(1).toLowerCase();
  const body = {
    name: nome,
    surname: cognome,
    email: emailUser.value.trim().toLowerCase(),
  };

  try {
    const response = await fetch(`${API_URL}/api/auth/updateUser`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Errore durante l'aggiornamento");
    }
  } catch (error) {
    console.error("Errore:", error);
  }
  firstName.value = "";
  lastName.value = "";
  emailUser.value = "";
  getDataUser();
  saveChanges.style.opacity = "0.3";
  saveChanges.style.pointerEvents = "none";
});
async function mostraProfilo() {
  const user = await getCurrentUser();

  const name = document.getElementById("name");
  const surname = document.getElementById("surname");
  const nameComplete = document.getElementById("nameComplete");
  const surnameComplete = document.getElementById("surnameComplete");
  const imgElement = document.getElementById("avatar-img");

  if (user) {
    if (user.avatar) {
      const baseUrl = "http://localhost:3000";
      imgElement.src = baseUrl + user.avatar;
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
    hello.innerText = `Good morning, user`;
  }
}
async function sync2FASwitch() {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) return;

    const data = await response.json();

    if (data.authenticated && data.user) {
      switchAuth.checked = data.user.is_two_factor_enabled === 1;
    }
  } catch (error) {
    console.error("Errore nel recupero dello stato 2FA:", error);
  }
}
async function syncBackupSwitch() {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      credentials: "include",
    });
    if (!response.ok) return;

    const data = await response.json();

    if (data.authenticated && data.user) {
      switchBackup.checked = data.user.is_auto_backup_enabled === 1;
    }
  } catch (error) {
    console.error("Errore nel recupero dello stato del backup:", error);
  }
}
//=====

notificationBtn.addEventListener("click", (e) => {
  notificationDropdown.classList.toggle("show");
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
let ultimoNumeroNotifiche = 0;
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

  socket.on("avatar_delete", (notifica) => {
    console.error("❌ DELETE AVATAR:", notifica.message);
    getDataUser();
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

//=====
document.getElementById("change-password").addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "/public/forgot.html";
  localStorage.setItem("provenienza", "settings");
  localStorage.setItem("email", email);
});

syncBackupSwitch();
isAdmin();

loadNotification();
controlButton();
sync2FASwitch();
gestisciDatiProtetti();
getCurrentUser();
getDataUser();
mostraProfilo();
checkAuth();

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();

      if (data.user && data.user.email_notifications) {
        emailNotify.checked = true;
      } else {
        emailNotify.checked = false;
      }
    }
  } catch (error) {
    console.error("Errore nel recupero dello stato iniziale:", error);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const pushEmail = document.getElementById("pushEmail");
  const webPush = document.getElementById("webPush");
  const systemPush = document.getElementById("systemPush");

  pushEmail.checked = true;
  webPush.checked = true;
  systemPush.checked = true;
  document.getElementById("labelPush").style.pointerEvents = "none";
  document.getElementById("labelPush").style.opacity = "0.3";

  document.getElementById("pushLabel").style.pointerEvents = "none";
  document.getElementById("pushLabel").style.opacity = "0.3";

  document.getElementById("systemLabel").style.pointerEvents = "none";
  document.getElementById("systemLabel").style.opacity = "0.3";
});
if (activeLink) {
  const sectionName = activeLink.querySelector("span").innerText;
  current.innerText = sectionName;
  navigation.innerText = `Nexa > ${sectionName}`;
}

storage.textContent = "0 MB";
numberRecords.textContent = "0 MB";

async function getStorage() {
  const response = await fetch(`${API_URL}/api/auth/getStorage`, {
    method: "GET",
    credentials: "include",
  });
  const data = await response.json();
  storage.textContent = `${data.storage} MB`;
  const storageMeter = (document.querySelector(".storage-meter").value =
    data.storage > 0 ? data.storage : 0);
}
async function getRecords() {
  const response = await fetch(`${API_URL}/api/auth/getRecords`, {
    method: "GET",
    credentials: "include",
  });
  const data = await response.json();
  numberRecords.textContent = data.records;
  collections.value = `Across ${data.collections} collections`;
}

async function createBackup() {
  try {
    const response = await fetch(`${API_URL}/api/auth/createBackup`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Errore durante il backup");
    }

    if (messageBackup) {
      messageBackup.style.display = "inline-block"; // o "flex"
      messageBackup.textContent = "Backup creato correttamente!";
    }
  } catch (error) {
    console.error("Errore Backup:", error);

    if (messageBackup) {
      messageBackup.style.display = "inline-block";
      messageBackup.style.color = "red";
      messageBackup.textContent = error.message || "Errore durante il backup";
    }
  }
}

if (backupBtn) {
  backupBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    createBackup();
  });
}

async function getLastBackup() {
  try {
    const response = await fetch(`${API_URL}/api/auth/lastBackup`, {
      credentials: "include",
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Errore HTTP: ${response.status}`);
    }

    const data = await response.json();

    const dataGrezza = data.date;

    if (!dataGrezza || data.date === "Nessun backup eseguito") {
      lastBackup.innerText = "Non ci sono backup";
      return;
    }
    const backupDate = new Date(dataGrezza);
    const today = new Date();

    const isToday =
      backupDate.getDate() === today.getDate() &&
      backupDate.getMonth() === today.getMonth() &&
      backupDate.getFullYear() === today.getFullYear();

    const timeFormatter = new Intl.DateTimeFormat("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    if (isToday) {
      lastBackup.innerText = `Today, ${timeFormatter.format(backupDate)}`;
    } else {
      const fullFormatter = new Intl.DateTimeFormat("it-IT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      lastBackup.innerText = fullFormatter.format(backupDate);
    }
  } catch (error) {
    console.error("Errore durante il recupero dell'ultimo backup:", error);
    lastBackup.innerText = "Errore caricamento";
  }
}

exportsData.addEventListener("click", async (e) => {
  e.preventDefault();
  const btn = this;
  btn.disabled = true;
  messageBackup.textContent = "Generazione file in corso...";
  const response = await fetch(`${API_URL}/api/auth/exportData`, {
    credentials: "include",
    method: "GET",
  });

  if (!response.ok) throw new Error("Download fallito");

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "export_dati.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
});

exportMyData.addEventListener("click", async (e) => {
  e.preventDefault();
  const btn = this;
  btn.disabled = true;
  messageBackup.textContent = "Generazione file in corso...";
  const response = await fetch(`${API_URL}/api/auth/exportMyData`, {
    credentials: "include",
    method: "GET",
  });

  if (!response.ok) throw new Error("Download fallito");

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "export_Mydata.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
});

function triggerFileInput() {
  document.getElementById("avatar-input").click();
}
function triggerFileInput2() {
  document.getElementById("avatar-inputBoxUser").click();
}
function handleAvatarChange(event) {
  const file = event.target.files[0];

  if (file) {
    if (!file.type.startsWith("image/")) {
      alert("Per favore seleziona un file immagine valido.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {};
    reader.readAsDataURL(file);
    inviaAvatarAlServer(file);
  }
}
function inviaAvatarAlServer(file) {
  const formData = new FormData();
  formData.append("avatar", file);
  fetch(`${API_URL}/api/auth/update-avatar`, {
    credentials: "include",
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {})
    .catch((error) => {
      console.error("Errore durante il caricamento:", error);
    });
}

async function loadUserProfile() {
  try {
    const response = await fetch(
      `${API_URL}/api/auth/getUserProfile?userId=1`,
      {
        method: "GET",
        credentials: "include",
      },
    );
    if (!response.ok) throw new Error("Errore nel caricamento del profilo");

    const user = await response.json();
    const nome = user.full_name.split(" ")[0];
    const cognome = user.full_name.split(" ")[1];
    document.getElementById("customerUser").innerText = `${nome} ${cognome}`;
    document.getElementById("roleUser").innerText =
      user.role.toUpperCase() === "ADMIN" ? "Administrator" : "User";
    document.getElementById("emailUser").innerText = user.email;
    const initials = (
      user.full_name.split(" ")[0].charAt(0) +
      user.full_name.split(" ")[1].charAt(0)
    ).toUpperCase();

    initialsElement.innerText = initials;
    initialsUser = initials;
    if (user.avatar) {
      const baseUrl = "http://localhost:3000";

      imgElement.src = baseUrl + user.avatar;
      imgElement.style.display = "block";
      imgElement2.src = baseUrl + user.avatar;
      imgElement2.style.display = "block";
      initialsElement.style.display = "none";
    } else {
      imgElement.style.display = "none";
      imgElement2.style.display = "none";
      initialsElement.style.display = "block";
    }
  } catch (error) {
    console.error("Errore durante il caricamento del profilo:", error);
  }
}
function validaEmail(stringaEmail) {
  const value = stringaEmail.trim();

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
emailInput.addEventListener("input", function () {
  const isValid = validaEmail(this.value);

  if (isValid) {
    btnConfirmed.style.opacity = "1";
    btnConfirmed.style.pointerEvents = "auto";
  } else {
    btnConfirmed.style.opacity = "0.3";
    btnConfirmed.style.pointerEvents = "none";
  }
});
let valueSwitch = "";
async function aggiornaStatoEmailDb(nuovoValore, emailAssociata = "") {
  try {
    const response = await fetch(`${API_URL}/api/auth/setUserTrueEmailNotify`, {
      credentials: "include",
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        value: nuovoValore,
        email: emailAssociata,
      }),
    });

    if (!response.ok) {
      console.error("Errore durante l'aggiornamento dello stato");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Errore di rete:", error);
    return false;
  }
}

emailNotify.addEventListener("change", async function () {
  if (this.checked) {
    emailInput.value = "";
    email_error.style.display = "none";
    btnConfirmed.style.opacity = "0.3";
    btnConfirmed.style.pointerEvents = "none";

    overlay.style.display = "block";
    document.body.style.overflow = "hidden";
    enableEmailNotify.style.display = "block";
  } else {
    try {
      const resMe = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include",
      });
      if (resMe.ok) {
        const dataMe = await resMe.json();
        const istanzaAggiornata = await aggiornaStatoEmailDb(
          0,
          dataMe.user.email,
        );

        if (!istanzaAggiornata) {
          emailNotify.checked = true;
          alert("Impossibile disattivare le notifiche al momento.");
        }
      }
    } catch (err) {
      emailNotify.checked = true;
      console.error(err);
    }
  }
});

btnConfirmed.addEventListener("click", async (e) => {
  e.preventDefault();
  const emailValue = emailInput.value.trim();

  if (!validaEmail(emailValue)) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      credentials: "include",
    });

    if (!response.ok) {
      alert("Sessione non valida o scaduta.");
      return;
    }

    const data = await response.json();

    if (data.user.email === emailValue) {
      // L'email coincide, inviamo 1 al database
      const successo = await aggiornaStatoEmailDb(1, emailValue);

      if (successo) {
        emailNotify.checked = true;
        overlay.style.display = "none";
        document.body.style.overflow = "auto";
        enableEmailNotify.style.display = "none";
      } else {
        alert("Errore nel salvataggio delle impostazioni.");
      }
    } else {
      container_error.classList.add("active");
      error_text.textContent =
        "L'email inserita non corrisponde al tuo account.";
    }
  } catch (error) {
    console.error("Errore controllo autenticazione email:", error);
  }
});

document
  .getElementById("btn-cancel-notifyEmail")
  .addEventListener("click", function () {
    document.getElementById("enableEmailNotify").style.display = "none";
    emailNotify.checked = false;
  });
const overlay = document.getElementById("dialogOverlay");
switchAuth.addEventListener("change", async function () {
  if (this.checked) {
    this.checked = false;

    try {
      const response = await fetch(`${API_URL}/api/auth/setup2fa`, {
        credentials: "include",
        method: "POST",
      });

      if (!response.ok) throw new Error("Errore durante il setup 2FA");

      const data = await response.json();

      document.getElementById("qr-code-image").src = data.qrCodeUrl;
      overlay.style.display = "block";
      document.body.style.overflow = "hidden";
      document.getElementById("my-2fa-modal").style.display = "block";
    } catch (error) {
      console.error("Errore di rete o server:", error);
      alert("Impossibile avviare il setup della 2FA. Riprova più tardi.");
    }
  } else {
    this.checked = true;
    overlay.style.display = "block";
    document.body.style.overflow = "hidden";
    document.getElementById("my-disable-2fa-modal").style.display = "block";
  }
});
switchBackup.addEventListener("change", async function () {
  const nuovoStato = this.checked;
  this.checked = !nuovoStato;

  try {
    const response = await fetch(`${API_URL}/api/auth/autoBackup`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ abilita: nuovoStato }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      this.checked = nuovoStato;
      alert(data.message);
    } else {
      alert(data.error || "Impossibile modificare le impostazioni di backup.");
    }
  } catch (error) {
    console.error("Errore di rete:", error);
    alert("Errore di connessione al server.");
  }
});
document
  .getElementById("btn-cancel-disable")
  .addEventListener("click", function () {
    document.getElementById("my-disable-2fa-modal").style.display = "none";
    switchAuth.checked = true;
  });

document
  .getElementById("btn-confirm-disable")
  .addEventListener("click", async function () {
    const tokenInput = document.getElementById("disable-2fa-code").value;

    if (!tokenInput || tokenInput.length !== 6) {
      container_errorDelete.classList.add("active");
      container_errorDelete.classList.remove("success");
      error_formDelete.style.display = "block";
      error_formDelete.textContent = "Inserisci un codice valido di 6 cifre.";
      return;
    }

    const btnDisable = document.getElementById("btn-confirm-disable");
    const testoOriginale = btnDisable.innerHTML;

    btnDisable.disabled = true;
    btnDisable.innerHTML = `Disattivazione...`;

    container_errorDelete.classList.add("active");
    container_errorDelete.classList.add("success");
    error_formDelete.style.display = "block";
    error_formDelete.innerHTML = `<span class="spinner"></span> Disattivazione della 2FA in corso...`;

    try {
      const response = await fetch(`${API_URL}/api/auth/disable2Fa`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenInput }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        container_errorDelete.classList.add("active");
        container_errorDelete.classList.add("success");
        error_formDelete.style.display = "block";
        error_formDelete.textContent =
          "La verifica a due fattori è stata disattivata con successo.";

        setTimeout(() => {
          error_formDelete.textContent = "";
          error_formDelete.style.display = "none";
          container_errorDelete.classList.remove("active");
          container_errorDelete.classList.remove("success");

          document.getElementById("disable-2fa-code").value = "";
          document.getElementById("my-disable-2fa-modal").style.display =
            "none";
          document.getElementById("dialogOverlay").style.display = "none";
          document.body.style.overflow = "auto";
        }, 2000);

        switchAuth.checked = false;
      } else {
        container_errorDelete.classList.add("active");
        container_errorDelete.classList.remove("success");
        error_formDelete.style.display = "block";
        error_formDelete.textContent =
          result.error || "Codice errato. Impossibile disattivare.";
      }
    } catch (error) {
      console.error("Errore durante la disattivazione:", error);
      container_errorDelete.classList.remove("success");
      container_errorDelete.classList.add("active");
      error_formDelete.textContent = "Errore di rete durante la richiesta.";
      error_formDelete.style.display = "block";
    } finally {
      btnDisable.disabled = false;
      btnDisable.innerHTML = testoOriginale;
    }
  });
document
  .getElementById("btn-verify-2fa")
  .addEventListener("click", async function () {
    const tokenInput = document.getElementById("2fa-code-input").value;

    if (!tokenInput || tokenInput.length !== 6) {
      container_errorApp.classList.add("active");
      container_errorApp.classList.remove("success");
      error_formApp.style.display = "block";
      error_formApp.textContent = "Inserisci un codice valido a 6 cifre";
      return;
    }

    const btnVerify = document.getElementById("btn-verify-2fa");
    const testoOriginale = btnVerify.innerHTML;

    btnVerify.disabled = true;
    btnVerify.style.width = "180px";
    btnVerify.innerHTML = `Verifica in corso...`;

    container_errorApp.classList.add("active");
    container_errorApp.classList.add("success");
    error_formApp.style.display = "block";
    error_formApp.innerHTML = `<span class="spinner"></span> Verifica del codice 2FA in corso...`;

    try {
      const response = await fetch(`${API_URL}/api/auth/verify2fa`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: tokenInput }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        container_errorApp.classList.add("active");
        container_errorApp.classList.add("success");
        error_formApp.style.display = "block";
        error_formApp.textContent =
          "Autenticazione a due fattori attivata con successo";

        setTimeout(() => {
          dialog.close();
          error_formApp.textContent = "";
          error_formApp.style.display = "none";
          container_errorApp.classList.remove("active");
          container_errorApp.classList.remove("success");
        }, 2000);

        switchAuth.checked = true;
        document.getElementById("my-2fa-modal").style.display = "none";
        document.getElementById("dialogOverlay").style.display = "none";
        document.body.style.overflow = "auto";
      } else {
        container_errorApp.classList.add("active");
        container_errorApp.classList.remove("success");
        error_formApp.style.display = "block";
        error_formApp.textContent =
          result.error || "Codice non valido. Riprova!";
      }
    } catch (error) {
      console.error("Si è verificato un problema:", error);
      container_errorApp.classList.remove("success");
      container_errorApp.classList.add("active");
      error_formApp.textContent = "Errore di connessione o del server.";
      error_formApp.style.display = "block";
    } finally {
      btnVerify.disabled = false;
      btnVerify.innerHTML = testoOriginale;
    }
  });

document.addEventListener("DOMContentLoaded", loadUserProfile);

async function removeAvatar() {
  fetch(`${API_URL}/api/auth/deleteAvatar`, {
    credentials: "include",
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      imgElement.style.display = "none";
      imgElement2.style.display = "none";
      initialsElement.style.display = "block";
      initialsElement.innerHTML = `<span class="spinnerProfile"></span>`;
      setTimeout(() => {
        initialsElement.innerHTML = "";
        initialsElement.innerText = initialsUser;
      }, 3000);
      return false;
    })
    .catch((error) => {
      console.error("Errore durante il caricamento:", error);
    });
}

notifyOrders.addEventListener("change", async (e) => {
  const isChecked = e.target.checked;

  try {
    const response = await fetch(`${API_URL}/api/auth/setNotifyOrders`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ notifyOrders: isChecked }),
    });

    if (!response.ok) {
      alert("Impossibile aggiornare le impostazioni.");
      notifyOrders.checked = !isChecked;
      return;
    }
  } catch (error) {
    console.error("Errore di rete:", error);
    notifyOrders.checked = !isChecked;
  }
});
notifyApp.addEventListener("change", async (e) => {
  const isChecked = e.target.checked;

  try {
    const response = await fetch(`${API_URL}/api/auth/setNotifyApp`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ notifyApp: isChecked }),
    });

    if (!response.ok) {
      alert("Impossibile aggiornare le impostazioni.");
      notifyApp.checked = !isChecked;
      return;
    }
  } catch (error) {
    console.error("Errore di rete:", error);
    notifyApp.checked = !isChecked;
  }
});
notifyCustomers.addEventListener("change", async (e) => {
  const isChecked = e.target.checked;

  try {
    const response = await fetch(`${API_URL}/api/auth/setNotifyCustomers`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ notifyCustomers: isChecked }),
    });

    if (!response.ok) {
      alert("Impossibile aggiornare le impostazioni.");
      notifyCustomers.checked = !isChecked;
      return;
    }
  } catch (error) {
    console.error("Errore di rete:", error);
    notifyCustomers.checked = !isChecked;
  }
});
notifyProducts.addEventListener("change", async (e) => {
  const isChecked = e.target.checked;

  try {
    const response = await fetch(`${API_URL}/api/auth/setNotifyProducts`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ notifyProducts: isChecked }),
    });

    if (!response.ok) {
      alert("Impossibile aggiornare le impostazioni.");
      notifyProducts.checked = !isChecked;
      return;
    }
  } catch (error) {
    console.error("Errore di rete:", error);
    notifyProducts.checked = !isChecked;
  }
});
notifyUsers.addEventListener("change", async (e) => {
  const isChecked = e.target.checked;

  try {
    const response = await fetch(`${API_URL}/api/auth/setNotifyUsers`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ notifyUsers: isChecked }),
    });

    if (!response.ok) {
      alert("Impossibile aggiornare le impostazioni.");
      notifyUsers.checked = !isChecked;
      return;
    }
  } catch (error) {
    console.error("Errore di rete:", error);
    notifyUsers.checked = !isChecked;
  }
});

deleteWorkspace.addEventListener("click", () => {
  document.getElementById("delete-workspace-dialog").style.display = "block";
  document.getElementById("dialogOverlay").style.display = "block";
  document.body.style.overflow = "hidden";
});
document
  .getElementById("btn-cancel-dialogDelete")
  .addEventListener("click", () => {
    document.getElementById("delete-workspace-dialog").style.display = "none";
  });
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
function validaPassword2() {
  const passwordValue = passwordDeactive.value.trim();

  if (passwordValue.length < 8) {
    password_error2.textContent =
      "La password deve contenere almeno 8 caratteri.";
    password_error2.style.display = "block";
    return false;
  }
  if (!/[A-Z]/.test(passwordValue)) {
    password_error2.textContent =
      "La password deve contenere almeno una letter maiuscola.";
    password_error2.style.display = "block";
    return false;
  }
  if (!/[a-z]/.test(passwordValue)) {
    password_error2.textContent =
      "La password deve contenere almeno una lettera minuscola.";
    password_error2.style.display = "block";
    return false;
  }
  if (!/\d/.test(passwordValue)) {
    password_error2.textContent =
      "La password deve contenere almeno un numero.";
    password_error2.style.display = "block";
    return false;
  }
  if (!/[!@#$%^&*()_+=\-[\]{};':",./?]/.test(passwordValue)) {
    password_error2.textContent =
      "La password deve contenere almeno un carattere speciale (es. !@#$).";
    password_error2.style.display = "block";
    return false;
  }

  password_error.textContent = "";
  password_error.style.display = "none";
  return true;
}
document.getElementById("btn-confirm-delete").addEventListener("click", () => {
  if (!password.value.trim()) {
    container_errorAdd.classList.add("active");
    error_formAdd.textContent = "Il campo password è obbligatorio";
    return false;
  }
  const isPasswordValida = validaPassword();

  container_errorAdd.classList.remove("active");
  container_errorAdd.classList.remove("success");
  error_formAdd.textContent = "";

  if (!isPasswordValida) {
    container_errorAdd.classList.add("active");
    error_formAdd.textContent = "Correggi gli errori prima di inviare";
    return false;
  }

  const data = {
    password: password.value.trim(),
  };

  fetch("http://localhost:3000/api/auth/deleteWorkspace", {
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
      container_errorAdd.classList.add("active");
      container_errorAdd.classList.add("success");
      error_formAdd.textContent =
        "Gestionale eliminato con successo. Tutti i tuoi dati sono stati rimossi definitivamente. A breve verrai reindirizzato alla pagina di login";

      setTimeout(() => {
        window.location.replace("/public/login.html");
      }, 4000);
    })
    .catch((error) => {
      console.error("Si è verificato un problema:", error);
      container_errorAdd.classList.add("active");
      error_formAdd.textContent = error.message;
      return false;
    });
});

deactive_account.addEventListener("click", () => {
  document.getElementById("deactivate-account-dialog").style.display = "block";
  document.getElementById("dialogOverlay").style.display = "block";
  document.body.style.overflow = "hidden";
});
document
  .getElementById("btn-cancel-deactivate")
  .addEventListener("click", () => {
    document.getElementById("deactivate-account-dialog").style.display = "none";
  });
document
  .getElementById("btn-confirm-deactivate")
  .addEventListener("click", () => {
    if (!passwordDeactive.value.trim()) {
      container_errorDeactivate.classList.add("active");
      error_formDeactivate.textContent = "Il campo password è obbligatorio";
      return false;
    }
    const isPasswordValida = validaPassword2();

    container_errorDeactivate.classList.remove("active");
    container_errorDeactivate.classList.remove("success");
    error_formDeactivate.textContent = "";

    if (!isPasswordValida) {
      container_errorDeactivate.classList.add("active");
      error_formDeactivate.textContent = "Correggi gli errori prima di inviare";
      return false;
    }

    const data = {
      password: passwordDeactive.value.trim(),
    };

    fetch("http://localhost:3000/api/auth/deactivateAccount", {
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
        container_errorDeactivate.classList.add("active");
        container_errorDeactivate.classList.add("success");
        error_formDeactivate.textContent =
          "Account aziendale eliminato con successo. A breve verrai reindirizzato alla pagina di login";

        setTimeout(() => {
          window.location.replace("/public/login.html");
        }, 4000);
      })
      .catch((error) => {
        console.error("Si è verificato un problema:", error);
        container_errorDeactivate.classList.add("active");
        error_formDeactivate.textContent = error.message;
        return false;
      });
  });

getLastBackup();
getRecords();
getStorage();
