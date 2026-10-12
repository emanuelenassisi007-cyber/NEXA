const activeLink = document.getElementById("active");
const current = document.getElementById("current_section");
const navigation = document.getElementById("navigation");
const name = document.getElementById("name");
const surname = document.getElementById("surname");
const hello = document.getElementById("hello");
const selectedDate = document.getElementById("selected-date");
const numberCustomers = document.getElementById("nCustomers");
const percentage = document.getElementById("percentage");
const numberProduct = document.getElementById("nProducts");
const percentageProduct = document.getElementById("percentageProduct");
const numberOrders = document.getElementById("nOrders");
const percentageOrders = document.getElementById("percentageOrders");
const numberOrdersToday = document.getElementById("nOrdersToday");
const OrdersPending = document.getElementById("OrdersPending");
const revenue = document.getElementById("nRevenue");
const percentageRevenue = document.getElementById("percentageRevenue");
const canvas = document.getElementById("revenueChart");
const sevenDays = document.getElementById("sevenDays");
const trentaDays = document.getElementById("trentaDays");
const treMesi = document.getElementById("treMesi");
const dodiciMesi = document.getElementById("dodiciMesi");
const griglia = document.getElementById("products");
const error_form = document.getElementById("error-form");
const container_error = document.querySelector(".container-error");

const notificationBtn = document.getElementById("notification-btn");
const notificationDropdown = document.getElementById("notification-dropdown");
const notificationList = document.getElementById("notification-list");
const notificationBadge = document.getElementById("notification-badge");
const leggiTutto = document.getElementById("readAll");

//==TEMA==//
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
  const products = document.getElementById("products");

  if (!autenticato) {
    elementi.forEach((elemento) => {
      products.style.display = "flex";
      products.style.justifyContent = "center";
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
      document.querySelector(".sectioName").style.marginLeft = "30px";
    } else {
      document.querySelector(".sectioName").style.marginLeft = "0px";
      imgElement.style.display = "none";
      name.style.display = "block";
      surname.style.display = "block";
    }
    const partiNome = user.full_name.trim().split(" ");
    name.textContent = partiNome[0]?.charAt(0).toUpperCase() || "";
    surname.textContent = partiNome[1]?.charAt(0).toUpperCase() || "";
    nameComplete.textContent = user.full_name.trim().split(" ")[0];
    surnameComplete.textContent = user.full_name.trim().split(" ")[1];
    hello.innerText = `Good morning, ${partiNome[0]}`;
  } else {
    name.innerHTML = `
            <i class="fa-solid fa-user" style="color: #635BFF; font-size:13px"></i>
        `;
    hello.innerText = `Good morning, user`;
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
getCurrentUser();
loadNotification();
mostraProfilo();
checkAuth();

async function getUltimateOrders() {
  try {
    const response = await fetch(`${API_URL}/api/auth/orders`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Errore del server");

    const data = await response.json();

    let tuttoLHtml = "";

    data.ultimateOrders.forEach((element) => {
      const colorestato = () => {
        switch (element.status.toLowerCase()) {
          case "completed":
            return "#22C55E";
          case "pending":
            return "#EAB308";
          case "cancelled":
            return "#EF4444";
          default:
            return "black";
        }
      };

      const dataFormattata = new Date(element.date).toLocaleDateString("it-IT");
      const id = String(element.id).padStart(4, "0");
      const total = new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR",
      }).format(element.total);

      tuttoLHtml += `
         <span style="font-size:12px; color:#635BFF; font-weight:bold">#${id}</span>
         <span style="font-size:12px; color:var(--text-color); font-weight:normal">${element.customer}</span>
         <span style="font-size:12px; color:grey; font-weight:normal">${dataFormattata}</span>
         <span style="font-size:12px; color:${colorestato()}; font-weight:bold">${element.status}</span>
         <span style="font-size:12px; color:var(--text-color); font-weight:bold; text-align: right;">${total}</span>
         
         <hr style="grid-column: span 5; border: none; height: 1px; background-color: rgb(225, 225, 230); margin: 5px 0; width: 100%;" />
      `;
    });
    griglia.innerHTML = tuttoLHtml;
  } catch (error) {}
}

let myChartInstance = null;

if (activeLink) {
  const sectionName = activeLink.querySelector("span").innerText;
  current.innerText = sectionName;
  navigation.innerText = `Nexa > ${sectionName}`;
}

const range = "";

function formatDate(date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

async function getCustomers() {
  try {
    const response = await fetch(`${API_URL}/api/auth/customers`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Errore del server", response.status);
    }

    const data = await response.json();

    numberCustomers.innerText = data.data || "0";
    percentage.innerText = `+${data.percentage}% last month`;
  } catch (error) {}
}
async function getProducts() {
  try {
    const response = await fetch(`${API_URL}/api/auth/products`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Errore del server", response.status);
    }

    const data = await response.json();

    numberProduct.innerText = data.data || "0";
    percentageProduct.innerText = `+${data.percentage}% last month`;
  } catch (error) {}
}
async function getOrders() {
  try {
    const response = await fetch(`${API_URL}/api/auth/orders`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Errore del server", response.status);
    }

    const data = await response.json();

    numberOrders.innerText = data.data || "0";
    percentageOrders.innerText =
      `+${data.percentage}% last month` || "not available";
    numberOrdersToday.innerText = data.today || "0";
    OrdersPending.innerText = `${data.pending} pending`;
  } catch (error) {}
}
async function getRevenue() {
  try {
    const response = await fetch(`${API_URL}/api/auth/revenue`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Errore del server", response.status);
    }

    const data = await response.json();

    const revenueFormat = new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(data.revenue);

    revenue.innerText = ` ${revenueFormat}`;
    percentageRevenue.innerText =
      data.percentage >= 0 ? `↗ +${data.percentage}%` : `↘ ${data.percentage}%`;
  } catch (error) {}
}
function getThemeColors() {
  const css = getComputedStyle(document.documentElement);
  const read = (name) => css.getPropertyValue(name).trim();

  return {
    line: read("--primary-color"),
    text: read("--text-secondary"),
    grid: read("--border-color"),
    surface: read("--surface-color"),
    border: read("--border-secondary"),
  };
}
function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
let currentRange = "7_days";
async function getDataGraphic(range = currentRange) {
  currentRange = range;

  try {
    const response = await fetch(`${API_URL}/api/auth/graphic?range=${range}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();

    const labels = data.map((item) =>
      new Date(item.day).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      }),
    );
    const revenues = data.map((item) => item.revenue);

    const theme = getThemeColors();

    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight);
    gradient.addColorStop(0, hexToRgba(theme.line, 0.35));
    gradient.addColorStop(1, hexToRgba(theme.line, 0));

    if (myChartInstance !== null) {
      myChartInstance.destroy();
    }

    myChartInstance = new Chart(canvas, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Revenue",
            data: revenues,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: theme.line,
            borderWidth: 2,
            borderColor: theme.line,
            fill: true,
            backgroundColor: gradient,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: theme.text },
          },
          tooltip: {
            backgroundColor: theme.surface,
            titleColor: theme.text,
            bodyColor: theme.text,
            borderColor: theme.border,
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { color: theme.grid },
            ticks: { color: theme.text },
          },
          y: {
            grid: { display: false },
            border: { color: theme.grid },
            ticks: { color: theme.text },
          },
        },
      },
    });
  } catch (error) {
    console.error(error);
  }
}
function setupFilterButton(buttonElement, rangeValue) {
  buttonElement.addEventListener("click", () => {
    [sevenDays, trentaDays, treMesi, dodiciMesi].forEach((btn) =>
      btn.classList.remove("activeFilter"),
    );
    buttonElement.classList.add("activeFilter");
    getDataGraphic(rangeValue);
  });
}

setupFilterButton(sevenDays, "7_days");
setupFilterButton(trentaDays, "30_days");
setupFilterButton(treMesi, "3_months");
setupFilterButton(dodiciMesi, "12_months");

getUltimateOrders();

document.addEventListener("DOMContentLoaded", () => {
  getCustomers();
  getProducts();
  getOrders();
  getRevenue();
  getDataGraphic("7_days");
});
