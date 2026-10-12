const activeLink = document.getElementById("active");
const current = document.getElementById("current_section");
const navigation = document.getElementById("navigation");
const nameCustomer = document.getElementById("name");
const surname = document.getElementById("surname");
const statusApp = document.getElementById("statusOrder");
const switchButton = document.querySelectorAll(".switch span");
const calendarContainer = document.querySelector(".calendar-container");
const listViewContainer = document.querySelector(".box-customers");
const griglia = document.getElementById("appointments");
const legend = document.getElementById("legend");
const controls = document.querySelector(".calendar-controls");
const search = document.querySelector(".search-customer");
const searchApp = document.getElementById("search-input");
const pagination = document.getElementById("pagination");
const dialog = document.getElementById("addAppointment");
const closeDialog = document.getElementById("close-dialog");
const service = document.getElementById("service");
const name_customer = document.getElementById("customer");
const date = document.getElementById("date");
const today = new Date().toISOString().split("T")[0];
date.min = today;
const startTime = document.getElementById("start-time");
const endTime = document.getElementById("end-time");
const error_form = document.getElementById("error-form");
const container_error = document.querySelector(".container-error");
const error_formApp = document.getElementById("error-formApp");
const container_errorApp = document.querySelector(".container-errorApp");
const cancel = document.getElementById("cancel");
const saveAppointment = document.getElementById("saveAppointment");
const addAppointment = document.getElementById("add-appointment");

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
  const appointments = document.getElementById("appointments");

  if (!autenticato) {
    elementi.forEach((elemento) => {
      appointments.style.display = "flex";
      appointments.style.justifyContent = "center";
      elemento.style.justifyContent = "center";
      elemento.innerHTML = `<i class="fa-solid fa-lock"></i>`;
      addAppointment.style.pointerEvents = "none";
      addAppointment.style.opacity = "0.5";
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
  const appointmentsContainer = document.getElementById("appointments");

  if (user && user.role?.toUpperCase() === "ADMIN") {
    appointmentsContainer.classList.add("is-admin");
    appointmentsContainer.classList.remove("user");
    appointmentsContainer.classList.remove("is-user");
    if (name_customer) {
      name_customer.disabled = false;
      name_customer.value = "";
    }
  } else {
    appointmentsContainer.classList.add("is-user");
    appointmentsContainer.classList.remove("is-admin");
    appointmentsContainer.classList.add("user");
    if (name_customer) {
      name_customer.disabled = true;
      if (user) {
        name_customer.value = user.full_name;
      }
    }
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
    transports: ["websocket"],
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
  socket.on("appointments_updated", (notifica) => {
    getAppointment("", "", 1, false);
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
loadNotification();
mostraProfilo();
checkAuth();

legend.style.display = "flex";

searchApp.addEventListener("input", () => {
  value = statusApp.value === "All" ? "" : statusApp.value;
  getAppointment(value, searchApp.value, 1, false);
});
statusApp.addEventListener("change", () => {
  value = statusApp.value === "All" ? "" : statusApp.value;
  getAppointment(value, searchApp.value, 1, true);
});

function validaForm() {
  if (
    !name_customer.value.trim() ||
    !date.value.trim() ||
    !startTime.value.trim() ||
    !endTime.value.trim()
  ) {
    container_errorApp.classList.add("active");
    container_errorApp.classList.remove("success");
    error_formApp.textContent = "Tutti i campi sono obbligatori.";
    error_formApp.style.display = "block";
    return false;
  } else {
    container_errorApp.classList.remove("active");
    error_formApp.textContent = "";
    error_formApp.style.display = "none";
    return true;
  }
}

cancel.addEventListener("click", () => {
  service.value = "";
  name_customer.value = "";
  date.value = "";
  startTime.value = "";
  endTime.value = "";
  error_formApp.textContent = "";
  error_formApp.style.display = "none";
  container_errorApp.classList.remove("active");
  container_errorApp.classList.remove("success");
  dialog.close();
});

saveAppointment.addEventListener("click", (e) => {
  e.preventDefault();
  if (!validaForm()) {
    return;
  }
  const dateVal = document.getElementById("date").value;
  const startTimeVal = document.getElementById("start-time").value;
  const endTimeVal = document.getElementById("end-time").value;

  if (!validaAppuntamento(dateVal, startTimeVal, endTimeVal)) {
    return;
  }
  const appointment = {
    name: name_customer.value.trim(),
    service: service.value.trim(),
    date: date.value.trim(),
    startTime: startTime.value.trim(),
    endTime: endTime.value.trim(),
  };
  const testoOriginale = saveAppointment.innerHTML;
  saveAppointment.disabled = true;
  saveAppointment.innerHTML = `Salvataggio...`;
  container_errorApp.classList.add("active");
  container_errorApp.classList.add("success");
  error_formApp.style.display = "block";
  error_formApp.innerHTML = `<span class="spinner"></span> Salvataggio dell'appuntamento in corso...`;

  fetch(`${API_URL}/api/auth/addAppointment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(appointment),
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
      container_errorApp.classList.add("active");
      container_errorApp.classList.add("success");
      error_formApp.style.display = "block";
      error_formApp.textContent = "Nuovo appuntamento registrato con successo";
      setTimeout(() => {
        dialog.close();
        error_formApp.textContent = "";
        error_formApp.style.display = "none";
        container_errorApp.classList.remove("active");
        container_errorApp.classList.remove("success");
      }, 2000);
      return false;
    })
    .catch((error) => {
      console.error("Si è verificato un problema:", error);
      container_errorApp.classList.remove("success");
      container_errorApp.classList.add("active");
      error_formApp.textContent = error.message;
      error_formApp.style.display = "block";
    })
    .finally(() => {
      saveAppointment.disabled = false;
      saveAppointment.innerHTML = testoOriginale;
    });
});

addAppointment.addEventListener("click", () => {
  if (dialog.open) {
    dialog.close();
  } else {
    dialog.showModal();
  }
});

closeDialog.addEventListener("click", () => {
  service.value = "";
  name_customer.value = "";
  date.value = "";
  startTime.value = "";
  endTime.value = "";
  error_formApp.textContent = "";
  error_formApp.style.display = "none";
  container_errorApp.classList.remove("active");
  dialog.close();
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

if (activeLink && current && navigation) {
  const sectionName = activeLink.querySelector("span")?.innerText || "";
  current.innerText = sectionName;
  navigation.innerText = `Nexa > ${sectionName}`;
}

const START_HOUR = 9;
const HOUR_HEIGHT = 60;
let currentWeekDate = new Date();

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

let events = [];
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
  value = statusApp.value === "All" ? "" : statusApp.value;
  getAppointment(searchApp.value, value, page, false);
}

async function getAppointment(
  status = "",
  search = "",
  page = 1,
  isCalendar = true,
) {
  try {
    const response = await fetch(
      `${API_URL}/api/auth/getAppointments?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&page=${page}&isCalendar=${isCalendar}`,
      {
        method: "GET",
        credentials: "include",
      },
    );
    if (!response.ok) throw new Error("Errore del server");
    const data = await response.json();

    events = [];
    let html = "";
    griglia.innerHTML = "";

    if (data.appointment && Array.isArray(data.appointment)) {
      data.appointment.forEach((element) => {
        createPagination(data.currentPage, data.totalPages);
        const colorestato = () => {
          switch (element.status.toLowerCase()) {
            case "confirmed":
              return "#22C55E";
            case "cancelled":
              return "#FF0000";
            case "pending":
              return "#f3a108";
            default:
              return "#000000";
          }
        };
        const formattedDate =
          typeof element.date === "string"
            ? new Date(element.date).toLocaleDateString("en-CA", {
                timeZone: "Europe/Rome",
              })
            : element.date;
        events.push({
          id: element.id,
          title: element.title,
          client: element.client,
          date: formattedDate,
          startTime: element.start || element.start,
          endTime: element.end || element.end,
          status: element.status,
        });

        let dataStart = "--:--";
        let dataEnd = "--:--";

        if (element && element.start && element.end) {
          dataStart = element.start.substring(0, 5);
          dataEnd = element.end.substring(0, 5);
        } else {
          dataStart = "--:--";
          dataEnd = "--:--";
        }
        const visibilityModify =
          element.status && element.status.toLowerCase() === "pending"
            ? "visible"
            : "hidden";

        html = `
          <div class="appointment-row" data-id="${element.id}" style="display: contents;">
  
           <span style="font-size:12px; color:var(--text-color); font-weight:bold">${element.title}</span>
            <span style="font-size:12px; color:var(--text-color); font-weight:normal; align-items:start">${element.client}</span>
    
           <div style="display:flex; flex-direction:column; align-items:start">
            <span style="font-size:13px; color:var(--text-color); font-weight:normal">${formattedDate}</span>
            <span style="font-size:11px; color:grey; font-weight:normal">${dataStart} - ${dataEnd}</span>
          </div>
    
          <div style="display:flex; flex-direction:row; align-items:center; gap:20px">
             <button class="modifyApp" style="visibility: ${visibilityModify}" data-id="${element.id}">
                <span>Confirmed</span>
             </button>
             <button class="deleteApp" data-id="${element.id}">
                <i class="fa-solid fa-trash" style="color: rgb(255, 255, 255); pointer-events: none;"></i>
             </button>
             <span class="status-text" style="font-size:12px; color:${colorestato()}; font-weight:bold;">${element.status}</span>
         </div>
    
        <hr style="grid-column: span 4; border: none; height: 1px; background-color: rgb(225, 225, 230); margin: 5px 0; width: 100%;" />
  
      </div>
`;

        griglia.innerHTML += html;
      });

      await gestisciPulsantiAdmin();
    }
    renderWeek();
  } catch (error) {}
}

function validaAppuntamento(dateVal, startTimeVal, endTimeVal) {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  const dataSelezionata = new Date(dateVal);

  if (dataSelezionata < oggi) {
    container_errorApp.classList.add("active");
    container_errorApp.classList.remove("success");
    error_formApp.style.display = "block";
    error_formApp.textContent = "Non puoi selezionare una data passata!";
    return false;
  }

  if (startTimeVal && endTimeVal) {
    if (endTimeVal <= startTimeVal) {
      container_errorApp.classList.add("active");
      container_errorApp.classList.remove("success");
      error_formApp.style.display = "block";
      error_formApp.textContent =
        "L'orario di fine deve essere successivo all'orario di inizio";
      return false;
    }
  }

  const dataSelezionataStr = dataSelezionata.toISOString().split("T")[0];
  const oggiStr = new Date().toISOString().split("T")[0];

  if (dataSelezionataStr === oggiStr) {
    const oraAttuale = new Date().toTimeString().substring(0, 5);
    if (startTimeVal < oraAttuale) {
      container_errorApp.classList.add("active");
      container_errorApp.classList.remove("success");
      error_formApp.style.display = "block";
      error_formApp.textContent =
        "Non puoi selezionare un orario gia passato per la giornata di oggi";
      return false;
    }
  }

  return true;
}

function getMondayOfCurrentWeek() {
  const date = new Date(currentWeekDate);

  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + diffToMonday);

  return date;
}

function formatDateToISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addEventToCalendar(eventData) {
  const column = document.querySelector(
    `.day-column[data-date="${eventData.date}"]`,
  );
  if (!column) return;

  const [startH, startM] = eventData.startTime.split(":").map(Number);
  const [endH, endM] = eventData.endTime.split(":").map(Number);

  const startMinutes = (startH - START_HOUR) * 60 + startM;
  const durationMinutes = endH * 60 + endM - (startH * 60 + startM);

  const topPosition = (startMinutes / 60) * HOUR_HEIGHT;
  const height = (durationMinutes / 60) * HOUR_HEIGHT;

  const eventCard = document.createElement("div");
  eventCard.className = "event-card";
  eventCard.style.top = `${topPosition}px`;
  eventCard.style.height = `${height}px`;

  switch (eventData.status) {
    case "Confirmed":
      eventCard.style.backgroundColor = "#baedaec8";
      eventCard.style.borderLeft = "3px solid #24a304c8";
      break;
    case "Pending":
      break;
    case "Cancelled":
      eventCard.style.backgroundColor = "#edaeaec8";
      eventCard.style.borderLeft = "3px solid #a30404c8";
      break;
  }

  eventCard.innerHTML = `
    <div class="event-title">${eventData.title}</div>
    <div class="event-details">${eventData.client} <p>${eventData.startTime} - ${eventData.endTime}</p></div>
  `;

  const eventTitle = eventCard.querySelector(".event-title");
  const eventDetail = eventCard.querySelector(".event-details");
  switch (eventData.status) {
    case "Confirmed":
      eventTitle.style.color = "#1e7e12";
      eventDetail.style.color = "#2b8c20";
      break;
    case "Pending":
      break;
    case "Cancelled":
      eventTitle.style.color = "#a30404";
      eventDetail.style.color = "#bc2626";
      break;
  }

  column.appendChild(eventCard);
}

function renderWeek() {
  const monday = getMondayOfCurrentWeek();
  const headerContainer = document.querySelector(".calendar-header");
  const daysGrid = document.querySelector(".days-grid");

  if (!headerContainer || !daysGrid) return;

  headerContainer.innerHTML = '<div class="time-col-header"></div>';
  daysGrid.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + i);

    const isoDate = formatDateToISO(currentDate);
    const dayNumber = currentDate.getDate();

    // 1. Header del giorno
    const dayHeader = document.createElement("div");
    dayHeader.className = "day-header";
    dayHeader.innerHTML = `<span>${DAY_NAMES[i]}</span><strong>${dayNumber}</strong>`;
    headerContainer.appendChild(dayHeader);

    // 2. Colonna del giorno
    const dayColumn = document.createElement("div");
    dayColumn.className = "day-column";
    dayColumn.dataset.date = isoDate;
    daysGrid.appendChild(dayColumn);
  }

  const monthYearLabel = document.getElementById("currentMonthYear");

  if (monthYearLabel) {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    if (monday.getMonth() === sunday.getMonth()) {
      monthYearLabel.textContent = `${MONTH_NAMES[monday.getMonth()]} ${monday.getFullYear()}`;
    } else {
      monthYearLabel.textContent = `${MONTH_NAMES[monday.getMonth()]} - ${MONTH_NAMES[sunday.getMonth()]} ${sunday.getFullYear()}`;
    }
  }

  // Renderizza gli eventi della lista
  events.forEach((event) => addEventToCalendar(event));
}

function renderActiveView() {
  const view = getCurrentView();
  const status = statusApp.value === "All" ? "" : statusApp.value;

  if (view === "calendar") {
    legend.style.display = "flex";
    controls.style.display = "flex";
    search.style.display = "none";
    pagination.style.display = "none";

    if (calendarContainer) calendarContainer.style.display = "block";
    if (listViewContainer) listViewContainer.style.display = "none";

    getAppointment(status, "", 1, true);
  } else if (view === "list") {
    legend.style.display = "none";
    controls.style.display = "none";
    search.style.display = "flex";
    pagination.style.display = "flex";

    if (calendarContainer) calendarContainer.style.display = "none";
    if (listViewContainer) listViewContainer.style.display = "flex";

    getAppointment(status, search.value, 1, false);
  }
}

function getCurrentView() {
  const activeSpan = document.querySelector(".switch span.select");

  return activeSpan ? activeSpan.textContent.trim().toLowerCase() : "calendar";
}

search.addEventListener("input", () => {
  const status = statusApp.value === "All" ? "" : statusApp.value;

  if (getCurrentView() === "list") {
    getAppointment(status, searchApp.value);
  }
});

statusApp.addEventListener("change", () => {
  const status = statusApp.value === "All" ? "" : statusApp.value;

  const searchValue = getCurrentView() === "list" ? searchApp.value : "";

  getAppointment(status, searchValue);
});

document.addEventListener("DOMContentLoaded", () => {
  value = statusApp.value === "All" ? "" : statusApp.value;
  getAppointment(value, search.value, 1, true);
  renderWeek();

  const prevBtn = document.getElementById("prevWeekBtn");
  const nextBtn = document.getElementById("nextWeekBtn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      currentWeekDate.setDate(currentWeekDate.getDate() - 7);

      const status = statusApp.value === "All" ? "" : statusApp.value;

      getAppointment(status, "", 1, true);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentWeekDate.setDate(currentWeekDate.getDate() + 7);

      const status = statusApp.value === "All" ? "" : statusApp.value;

      getAppointment(status, "", 1, true);
    });
  }
});

switchButton.forEach((button) => {
  button.addEventListener("click", () => {
    switchButton.forEach((btn) => btn.classList.remove("select"));
    button.classList.add("select");
    renderActiveView();
  });
});

griglia.addEventListener("click", (e) => {
  const deleteBtn = e.target.closest(".deleteApp");
  const modifyBtn = e.target.closest(".modifyApp");

  if (deleteBtn) {
    e.preventDefault();
    if (deleteBtn.disabled) return;

    const appointmentId = deleteBtn.dataset.id;
    deleteBtn.disabled = true;

    fetch(`${API_URL}/api/auth/deleteAppointment`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ id: appointmentId }),
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
            throw new Error(`Errore interno del server (${response.status}).`);
          }
        }
        return response.json();
      })
      .then((data) => {
        const rigaAppuntamento =
          deleteBtn.closest(".appointment-row") || deleteBtn.parentElement;
        if (rigaAppuntamento) {
          rigaAppuntamento.remove();
        }
      })
      .catch((error) => {
        console.error(
          "Si è verificato un problema durante l'eliminazione:",
          error,
        );
        alert(error.message);
        deleteBtn.disabled = false; // Riabilita in caso di errore
      });
  }

  if (modifyBtn) {
    e.preventDefault();
    if (modifyBtn.disabled) return;

    const appointmentId = modifyBtn.dataset.id;
    modifyBtn.disabled = true;
    const spanTesto = modifyBtn.querySelector("span");
    const testoOriginale = spanTesto ? spanTesto.innerText : "Confirmed";
    if (spanTesto) spanTesto.innerText = "Conferma...";

    fetch(`${API_URL}/api/auth/confirmAppointment`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ id: appointmentId }),
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
            throw new Error(`Errore interno del server (${response.status}).`);
          }
        }
        return response.json();
      })
      .then((data) => {
        const rigaDaModificare = griglia.querySelector(
          `.appointment-row[data-id="${appointmentId}"]`,
        );
        if (rigaDaModificare) {
          const btnConferma = rigaDaModificare.querySelector(".modifyApp");
          if (btnConferma) btnConferma.style.visibility = "hidden";

          const testoStato = rigaDaModificare.querySelector(".status-text");
          if (testoStato) {
            testoStato.innerText = "Confirmed";
            testoStato.style.color = "#22C55E";
          }
        }
      })
      .catch((error) => {
        console.error(
          "Si è verificato un problema durante la conferma:",
          error,
        );
        alert(error.message);
        modifyBtn.disabled = false;
        if (spanTesto) spanTesto.innerText = testoOriginale;
      });
  }
});
