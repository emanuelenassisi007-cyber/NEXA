const activeLink = document.getElementById("active");
const current = document.getElementById("current_section");
const navigation = document.getElementById("navigation");
const name = document.getElementById("name");
const surname = document.getElementById("surname");
const griglia = document.getElementById("customers");
const search_input = document.getElementById("search-input");
const clearFilters = document.getElementById("clear-filters");
const typeStatus = document.getElementById("typeStatus");
const numberOrders = document.getElementById("numberOrders");
const pagination = document.getElementById("pagination");
const addCustomer = document.getElementById("add-customer");
const deleteCustomer = document.getElementById("delete-customer");
const dialog = document.getElementById("addCustomer");
const dialogDelete = document.getElementById("deleteCustomer");
const closeDialog = document.getElementById("close-dialog");
const closeDialogDelete = document.getElementById("close-dialogDelete");
const saveCustomer = document.getElementById("saveCustomer");
const nameCustomer = document.getElementById("firstName");
const surnameCustomer = document.getElementById("lastName");
const email = document.getElementById("email");
const emailDelete = document.getElementById("emailDelete");
const phone = document.getElementById("phone");
const address = document.getElementById("address");
const city = document.getElementById("city");
const error_form = document.getElementById("error-form");
const container_error = document.querySelector(".container-error");
const container_errorDelete = document.querySelector(
  ".container-errorDeleteCustomer",
);
const error_formDelete = document.getElementById("error-formDeleteCustomer");
const container_errorAdd = document.querySelector(
  ".container-errorAddCustomer",
);
const error_formAdd = document.getElementById("error-formAddCustomer");
const cancel = document.getElementById("cancel");

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
  const customers = document.getElementById("customers");

  if (!autenticato) {
    elementi.forEach((elemento) => {
      customers.style.display = "flex";
      customers.style.justifyContent = "center";
      elemento.style.justifyContent = "center";
      elemento.innerHTML = `<i class="fa-solid fa-lock" style="font-size: 24px"></i>`;
      addCustomer.style.pointerEvents = "none";
      addCustomer.style.opacity = "0.5";
      deleteCustomer.style.pointerEvents = "none";
      deleteCustomer.style.opacity = "0.5";
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
  }
}

async function gestisciPulsantiAdmin() {
  const user = await getCurrentUser();

  if (user && user.role?.toUpperCase() === "ADMIN") {
    addCustomer.style.display = "flex";
    deleteCustomer.style.display = "flex";
  } else {
    addCustomer.style.display = "none";
    deleteCustomer.style.display = "none";
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
loadNotification();
getCurrentUser();
mostraProfilo();
checkAuth();
gestisciPulsantiAdmin();

const regex =
  /^[a-zA-Z0-9.!#\$%&'*+/=?^_{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

const regexTelefono = /^(\+[\d]{1,4}[- ]?)?([\d]{9,11})$/;

function validaEmail() {
  if (
    !nameCustomer.value.trim() ||
    !surnameCustomer.value.trim() ||
    !email.value.trim() ||
    !phone.value.trim() ||
    !address.value.trim() ||
    !city.value.trim()
  ) {
    container_errorAdd.classList.add("active");
    container_errorAdd.classList.remove("success");
    error_formAdd.textContent = "Tutti i campi sono obbligatori.";
    error_formAdd.style.display = "block";
    return false;
  }
  const value = email.value.trim();

  if (!regex.test(value)) {
    container_errorAdd.classList.add("active");
    container_errorAdd.classList.remove("success");
    error_formAdd.textContent =
      "Inserisci un indirizzo email valido (es. you@company.com).";
    error_formAdd.style.display = "block";
    return false;
  } else {
    container_errorAdd.classList.remove("active");
    error_formAdd.textContent = "";
    error_formAdd.style.display = "none";
    return true;
  }
}
function validaEmailDelete() {
  if (!emailDelete.value.trim()) {
    container_errorDelete.classList.add("active");
    container_errorDelete.classList.remove("success");
    error_formDelete.textContent = "Il campo email è obbligatorio";
    error_formDelete.style.display = "block";
    return false;
  }
  const value = emailDelete.value.trim();

  if (!regex.test(value)) {
    container_errorDelete.classList.add("active");
    container_errorDelete.classList.remove("success");
    error_formDelete.textContent =
      "Inserisci un indirizzo email valido (es. you@company.com).";
    error_formDelete.style.display = "block";
    return false;
  } else {
    container_errorDelete.classList.remove("active");
    error_formDelete.textContent = "";
    error_formDelete.style.display = "none";
    return true;
  }
}
function validaPhone() {
  const telephone = Number(phone.value.trim());

  if (!regexTelefono.test(telephone)) {
    container_errorAdd.classList.add("active");
    container_errorAdd.classList.remove("success");
    error_formAdd.textContent = "Inserisci un numero di telefono valido.";
    error_formAdd.style.display = "block";
    return false;
  } else {
    container_errorAdd.classList.remove("active");
    error_formAdd.textContent = "";
    error_formAdd.style.display = "none";
    return true;
  }
}

cancel.addEventListener("click", () => {
  nameCustomer.value = "";
  surnameCustomer.value = "";
  email.value = "";
  phone.value = "";
  address.value = "";
  city.value = "";
  error_form.textContent = "";
  error_form.style.display = "none";
  container_error.classList.remove("active");
  container_error.classList.remove("success");
  dialog.close();
});

document.getElementById("cancelDelete").addEventListener("click", () => {
  emailDelete.value = "";
  error_form.textContent = "";
  error_form.style.display = "none";
  container_error.classList.remove("active");
  dialogDelete.close();
});

saveCustomer.addEventListener("click", (e) => {
  e.preventDefault();
  if (!validaEmail() || !validaPhone) {
    return;
  }
  const customer = {
    name: nameCustomer.value.trim(),
    surname: surnameCustomer.value.trim(),
    email: email.value.trim(),
    phone: phone.value.trim(),
    address: address.value.trim(),
    city: city.value.trim(),
  };

  fetch(`${API_URL}/api/auth/addCustomer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(customer),
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
      container_errorAdd.classList.add("active");
      container_errorAdd.classList.add("success");
      error_formAdd.style.display = "block";
      error_formAdd.textContent = "Nuovo customer registrato con successo";
      setTimeout(() => {
        dialog.close();
        error_formAdd.textContent = "";
        error_formAdd.style.display = "none";
        container_errorAdd.classList.remove("active");
        container_errorAdd.classList.remove("success");
      }, 2000);
      return false;
    })
    .catch((error) => {
      console.error("Si è verificato un problema:", error);
      container_errorAdd.classList.remove("success");
      container_errorAdd.classList.add("active");
      error_formAdd.textContent = error.message;
      error_formAdd.style.display = "block";
    });
});

addCustomer.addEventListener("click", () => {
  if (dialog.open) {
    dialog.close();
  } else {
    dialog.showModal();
  }
});

deleteCustomer.addEventListener("click", () => {
  if (dialogDelete.open) {
    dialogDelete.close();
  } else {
    dialogDelete.showModal();
  }
});

closeDialog.addEventListener("click", () => {
  nameCustomer.value = "";
  surnameCustomer.value = "";
  email.value = "";
  phone.value = "";
  address.value = "";
  city.value = "";
  error_form.textContent = "";
  error_form.style.display = "none";
  container_error.classList.remove("active");
  dialog.close();
});

closeDialogDelete.addEventListener("click", () => {
  emailDelete.value = "";
  error_form.textContent = "";
  error_form.style.display = "none";
  container_error.classList.remove("active");
  dialogDelete.close();
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

dialogDelete.addEventListener("click", (event) => {
  const rect = dialogDelete.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  ) {
    dialogDelete.close();
  }
});

function resetFilters() {
  numberOrders.value = "";
  typeStatus.value = "All";
  clearFilters.style.display = "none";
  const status = "";
  getUltimateCustomers("", "", 0);
}

if (
  (numberOrders.value === "0" || numberOrders.value === "") &&
  typeStatus.value === "All"
) {
  clearFilters.style.display = "none";
} else {
  clearFilters.style.display = "block";
}

if (activeLink) {
  const sectionName = activeLink.querySelector("span").innerText;
  current.innerText = sectionName;
  navigation.innerText = `Nexa > ${sectionName}`;
}

numberOrders.addEventListener("change", (e) => {
  const status = typeStatus.value === "All" ? "" : typeStatus.value;
  const orders = numberOrders.value === "" ? "" : Number(numberOrders.value);
  getUltimateCustomers(search_input.value, status, orders, 1);
  clearFilters.style.display = "block";
});
typeStatus.addEventListener("change", (e) => {
  const status = typeStatus.value === "All" ? "" : typeStatus.value;
  const orders = numberOrders.value === "" ? "" : Number(numberOrders.value);
  getUltimateCustomers(search_input.value, status, orders, 1);
  clearFilters.style.display = "block";
});

clearFilters.addEventListener("click", resetFilters);

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
function changePage(page) {
  const status = typeStatus.value === "All" ? "" : typeStatus.value;

  const orders = numberOrders.value === "" ? "" : Number(numberOrders.value);

  getUltimateCustomers(search_input.value, status, orders, page);
}
async function getUltimateCustomers(
  search = "",
  status = "",
  orders = 0,
  page = 1,
) {
  try {
    const response = await fetch(
      `${API_URL}/api/auth/getCustomers?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&orders=${orders}&page=${page}`,
      {
        credentials: "include",
      },
    );
    if (!response.ok) throw new Error("Errore del server");

    const data = await response.json();

    let tuttoLHtml = "";

    data.customers.forEach((element) => {
      const colorestato = () => {
        switch (element.status.toLowerCase()) {
          case "active":
            return "#22C55E";
          case "inactive":
            return "#FF0000";
          default:
            return "black";
        }
      };

      createPagination(data.currentPage, data.totalPages);

      const name = element.nome;
      const email = element.email;
      const number = element.number;
      const orders = element.number_order;
      const status = !element.status ? "Non presente" : element.status;
      const total = new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR",
      }).format(element.total);

      function timeAgo(date) {
        if (!date) return "Nessuna attività";
        const now = new Date();
        const activity = new Date(date);

        const diff = now - activity;

        const minuti = Math.floor(diff / (1000 * 60));
        const ore = Math.floor(diff / (1000 * 60 * 60));
        const giorni = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minuti < 1) {
          return "Adesso";
        }

        if (minuti < 60) {
          return `${minuti} min fa`;
        }

        if (ore < 24) {
          return `${ore} ${ore === 1 ? "ora" : "ore"} fa`;
        }

        if (giorni === 1) {
          return "Ieri";
        }

        if (giorni >= 365) {
          const anno = Math.floor(giorni / 365);
          return `${anno} ${anno === 1 ? "anno" : "anni"} fa`;
        }
        if (giorni >= 30.44) {
          const mese = Math.floor(giorni / 30.44);
          return `${mese} ${mese === 1 ? "mese" : "mesi"} fa`;
        }

        return `${giorni} giorni fa`;
      }

      const lastActivity = timeAgo(element.last_activity);
      const date = element.last_activity
        ? new Date(element.last_activity).toLocaleDateString("it-IT")
        : "-";

      const partiNome = name.split(" ");

      const initNameCustomer = partiNome[0]?.charAt(0).toUpperCase() || "";

      const initSurnameCustomer = partiNome[1]?.charAt(0).toUpperCase() || "";

      tuttoLHtml += `
           <div class="customer-row" data-email="${element.email}" style="display: contents;">
              <div style = "display:flex; flex-direction:row; align-items:center; gap:7px;">
                <div class="profile">
                <span>${initNameCustomer}</span>
                <span>${initSurnameCustomer}</span>
              </div>
                <span style="font-size:12px; color:var(--text-color); font-weight:bold">${name}</span>
              </div>
              <div style = "display:flex; flex-direction:column; align-items:start; gap:6px">
              <span style="font-size:12px; color:var(--text-color); font-weight:normal; align-items:start">${email}</span>
              <span style="font-size:10px; color:grey; font-weight:normal; align-items:start">+${number}</span>
              </div>
              <span style="font-size:12px; color:grey; font-weight:normal">${orders}</span>
              <span style="font-size:12px; color:var(--text-color); font-weight:bold;">${total}</span>
              <div style = "display:flex; flex-direction:column; align-items:start; gap:6px">
                <span style="font-size:12px; color:var(--text-color); font-weight:normal;">${lastActivity}</span>
                <span style="font-size:10px; color:grey; font-weight:normal">${date}</span>
              </div>
              <span style="font-size:12px; color:${colorestato()}; font-weight:bold">${status}</span>
              <hr style="grid-column: span 6; border: none; height: 1px; background-color: rgb(225, 225, 230); margin: 5px 0; width: 100%;" />
          </div>
          `;
    });

    griglia.innerHTML = tuttoLHtml;
    document
      .getElementById("delete_customer")
      .addEventListener("click", (e) => {
        e.preventDefault();
        if (!validaEmailDelete()) {
          return;
        }

        fetch(`${API_URL}/api/auth/deleteCustomer`, {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: emailDelete.value.trim() }),
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
            container_errorDelete.classList.add("active");
            container_errorDelete.classList.add("success");
            error_formDelete.style.display = "block";
            error_formDelete.textContent = "Customer eliminato con successo";

            setTimeout(() => {
              dialogDelete.close();
              error_formDelete.textContent = "";
              error_formDelete.style.display = "none";
              container_errorDelete.classList.remove("active");
              container_errorDelete.classList.remove("success");
            }, 2000);
            const emailDaEliminare =
              data && data.email ? data.email : emailDelete.value.trim();
            const rigaCustomer = document.querySelector(
              `.customer-row[data-email="${emailDaEliminare}"]`,
            );
            if (rigaCustomer) {
              rigaCustomer.remove();
            } else {
              console.warn(
                `Impossibile trovare nel DOM la riga con email: ${emailDaEliminare}`,
              );
            }
            return false;
          })
          .catch((error) => {
            console.error("Si è verificato un problema:", error);
            container_errorDelete.classList.remove("success");
            container_errorDelete.classList.add("active");
            error_formDelete.textContent = error.message;
            error_formDelete.style.display = "block";
          });
      });
  } catch (error) {}
}
getUltimateCustomers();

search_input.addEventListener("input", () => {
  const status = typeStatus.value === "All" ? "" : typeStatus.value;
  const orders = numberOrders.value === "" ? "" : Number(numberOrders.value);
  getUltimateCustomers(search_input.value, status, orders, 1);
});
