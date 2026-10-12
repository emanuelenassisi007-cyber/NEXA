const activeLink = document.getElementById("active");
const current = document.getElementById("current_section");
const navigation = document.getElementById("navigation");
const nameCustomer = document.getElementById("name");
const surname = document.getElementById("surname");
const griglia = document.getElementById("notifications");
const search_input = document.getElementById("search-input");
const clearFilters = document.getElementById("clear-filters");
const pagination = document.getElementById("pagination");
const error_form = document.getElementById("error-form");
const container_error = document.querySelector(".container-error");
const viewNotify = document.getElementById("viewNotify");
const notificationBtn = document.getElementById("notification-btn");
const notificationDropdown = document.getElementById("notification-dropdown");
const notificationList = document.getElementById("notification-list");
const notificationBadge = document.getElementById("notification-badge");
const leggiTutto = document.getElementById("readAll");
const readAll = document.getElementById("readAllNotif");
let idNotificaCorrenteNelPopup = null;

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
  const notifications = document.getElementById("notifications");

  if (!autenticato) {
    elementi.forEach((elemento) => {
      notifications.style.display = "flex";
      notifications.style.justifyContent = "center";
      elemento.style.justifyContent = "center";
      elemento.innerHTML = `<i class="fa-solid fa-lock"></i>`;
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
function chiudiIlPopup() {
  document.body.style.overflow = "auto";

  const overlay = document.getElementById("dialogOverlay");
  const popup = document.getElementById("viewNotify");

  if (overlay) overlay.style.display = "none";
  if (popup) popup.style.display = "none";
}
async function readAllNotif() {
  try {
    const response = await fetch(`${API_URL}/api/auth/setReadAll`, {
      method: "PATCH",
      credentials: "include",
    });

    const data = await response.json();

    if (data.success) {
      const allTexts = document.querySelectorAll(".notif-text");

      allTexts.forEach((textSpan) => {
        textSpan.style.fontWeight = "normal";
      });
    }
  } catch (error) {
    console.error("Errore durante l'aggiornamento della notifica:", error);
  }
}

async function leggiNotifica(leggiNotificaId) {
  if (!leggiNotificaId || isNaN(leggiNotificaId)) {
    console.warn(
      "Chiamata a leggiNotifica bloccata: ID non valido o non ancora selezionato.",
      leggiNotificaId,
    );
    return;
  }

  const id = Number(leggiNotificaId);
  try {
    const response = await fetch(`${API_URL}/api/auth/readNotify/${id}`, {
      method: "PATCH",
      credentials: "include",
    });

    const data = await response.json();

    if (response.ok || data.success) {
      document.getElementById("dialogOverlay").style.display = "none";
      document.body.style.overflow = "auto";
      if (typeof viewNotify !== "undefined") viewNotify.style.display = "none";
      await getNotifications();
    }
  } catch (error) {
    console.error("Errore durante l'aggiornamento della notifica:", error);
  }
}

gestisciDatiProtetti();
getCurrentUser();
mostraProfilo();
checkAuth();
loadNotification();

function resetFilters() {
  search_input.value = "";
  getNotifications("", 1);
  clearFilters.style.display = "none";
}

if (activeLink) {
  const sectionName = activeLink.querySelector("span").innerText;
  current.innerText = sectionName;
  navigation.innerText = `Nexa > ${sectionName}`;
}

async function OpenNotification(id, type, title, message, date) {
  const idNotifica = document.getElementById("idNotifica");
  const typeNotifica = document.getElementById("typeNotifica");
  const titleNotifica = document.getElementById("titleNotifica");
  const messageNotifica = document.getElementById("messageNotifica");
  const dateNotifica = document.getElementById("dateNotifica");
  const overlay = document.getElementById("dialogOverlay");

  overlay.style.display = "block";
  document.body.style.overflow = "hidden";
  viewNotify.style.display = "block";

  const newDate = new Date(date).toLocaleDateString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  idNotifica.innerText = `#${String(id).padStart(4, "0")}`;
  typeNotifica.innerText = type;
  titleNotifica.innerText = title;
  messageNotifica.innerText = message;
  dateNotifica.innerText = newDate;

  idNotifica.dataset.idpuro = id;
  idNotificaCorrenteNelPopup = id;
}

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
  getNotifications(search_input.value, page);
}
async function getNotifications(search = "", page = 1) {
  let idUser = "";
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    idUser = data.user.id;
  } catch (error) {
    console.error("Errore controllo autenticazione:", error);
  }
  try {
    const response = await fetch(
      `${API_URL}/api/auth/getAllNotifications?search=${encodeURIComponent(search)}&page=${page}&id=${idUser}`,
      {
        credentials: "include",
      },
    );
    if (!response.ok) throw new Error("Errore del server");

    const data = await response.json();

    let tuttoLHtml = "";

    data.notifications.forEach((element) => {
      createPagination(data.currentPage, data.totalPages);

      const id = String(element.id).padStart(4, "0");
      const title = element.title.slice(0, 17) + "...";
      const message = element.message.slice(0, 17) + "...";
      const date = new Date(element.date).toLocaleDateString("it-IT");
      const type = element.type;

      tuttoLHtml += `
    <div class="appointment-row" data-id="${element.id}" style="display: contents;">
      <span class="notif-text" style="font-size:12px; color:#635BFF; font-weight: ${element.is_read ? "normal" : "bold"};">#${id}</span>
      <span class="notif-text" style="font-size:12px; color: var(--text-color); font-weight: ${element.is_read ? "normal" : "bold"}; align-items:start;">${type}</span>
      <span class="notif-text" style="font-size:12px; color:grey; font-weight: ${element.is_read ? "normal" : "bold"};">${title}</span>
      <span class="notif-text" style="font-size:12px; color:var(--text-color); font-weight: ${element.is_read ? "normal" : "bold"};">${message}</span>
      <span class="notif-text" style="font-size:12px; color:var(--text-color); font-weight: ${element.is_read ? "normal" : "bold"};">${date}</span>
      
      <button class="deleteNotif" data-notif-id="${element.id}">
        <span style="font-size:13px; font-weight:normal;">Elimina</span>
      </button>
      <button class="buttonDetail" data-notif-id="${element.id}" data-notif-type="${element.type}" data-notif-title="${element.title}" data-notif-date="${element.date}" data-notif-message="${element.message}">
        <span style="font-size:14px; color:var(--text-color); font-weight:bold;">...</span>
      </button>
      <hr style="grid-column: span 7; border: none; height: 1px; background-color: rgb(225, 225, 230); margin: 5px 0; width: 100%;" />
    </div>
`;
    });

    griglia.innerHTML = tuttoLHtml;
    const buttonDetail = document.querySelectorAll(".buttonDetail");
    const deleteNotif = document.querySelectorAll(".deleteNotif");
    const text1 = document.getElementById("text1");
    const text2 = document.getElementById("text2");
    const text3 = document.getElementById("text3");
    const text4 = document.getElementById("text4");
    const text5 = document.getElementById("text5");

    readAll.addEventListener("click", () => {
      readAllNotif();
    });

    buttonDetail.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();

        const notifyId = button.dataset.notifId;
        const typeNotif = button.dataset.notifType;
        const titleNotif = button.dataset.notifTitle;
        const dateNotif = button.dataset.notifDate;
        const messageNotif = button.dataset.notifMessage;

        OpenNotification(
          notifyId,
          typeNotif,
          titleNotif,
          messageNotif,
          dateNotif,
        );
      });
    });
    deleteNotif.forEach((notif) => {
      const idNotif = notif.dataset.notifId;
      notif.addEventListener("click", () => {
        fetch(`${API_URL}/api/auth/deleteNotification`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ id: idNotif }),
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
                  `Errore interno del server (${response.status}).`,
                );
              }
            }
            return response.json();
          })
          .then((data) => {
            const rigaNotifica =
              notif.closest(".appointment-row") || notif.parentElement;
            if (rigaNotifica) {
              rigaNotifica.remove();
            }
            const righeRimaste =
              document.querySelectorAll(".appointment-row").length;
            if (righeRimaste <= 1 && page > 1) {
              getNotifications(search, page - 1);
            } else {
              getNotifications(search, page);
            }
          })
          .catch((error) => {
            console.error(
              "Si è verificato un problema durante l'eliminazione:",
              error,
            );
            alert(error.message);
          });
      });
    });
  } catch (error) {}
}
getNotifications();

search_input.addEventListener("input", () => {
  getNotifications(search_input.value, 1);
  clearFilters.style.display = "block";
});

const bottoneLeggiPopup = document.getElementById("btn-read-notifyEmail");

if (bottoneLeggiPopup) {
  bottoneLeggiPopup.addEventListener("click", (e) => {
    e.preventDefault();

    const idNotificaEl = document.getElementById("idNotifica");
    const idSelezionato = idNotificaEl ? idNotificaEl.dataset.idpuro : null;

    if (idSelezionato) {
      leggiNotifica(idSelezionato);
    } else {
      console.error(
        "Errore: impossibile trovare l'ID della notifica da leggere.",
      );
    }
  });
} else {
  console.warn(
    "Attenzione: JavaScript non ha trovato nessun pulsante con l'ID fornito.",
  );
}
