const activeLink = document.getElementById("active");
const current = document.getElementById("current_section");
const navigation = document.getElementById("navigation");
const nameCustomer = document.getElementById("name");
const surname = document.getElementById("surname");
const griglia = document.getElementById("backups");
const search_input = document.getElementById("search-input");
const clearFilters = document.getElementById("clear-filters");
const orderStatus = document.getElementById("statusOrder");
const pagination = document.getElementById("pagination");
const addOrder = document.getElementById("add-order");
const nameProduct = document.getElementById("nameProduct");
const category = document.getElementById("category");
const price = document.getElementById("price");
const stock = document.getElementById("stock");
const percentageProduct = document.getElementById("percentageProduct");
const numberOrders = document.getElementById("nOrders");
const revenue = document.getElementById("nRevenue");
const percentageRevenue = document.getElementById("percentageRevenue");
const numberCustomers = document.getElementById("nCustomers");
const percentage = document.getElementById("percentage");
const numberProduct = document.getElementById("nProducts");
const percentagePending = document.getElementById("percentageProduct");
const error_form = document.getElementById("error-form");
const container_error = document.querySelector(".container-error");

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
  const orders = document.getElementById("orders");

  if (!autenticato) {
    elementi.forEach((elemento) => {
      orders.style.display = "flex";
      orders.style.justifyContent = "center";
      elemento.style.justifyContent = "center";
      elemento.innerHTML = `<i class="fa-solid fa-lock"></i>`;
      addOrder.style.pointerEvents = "none";
      addOrder.style.opacity = "0.5";
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

  if (user) {
    const partiNome = user.full_name.trim().split(" ");
    name.textContent = partiNome[0]?.charAt(0).toUpperCase() || "";
    surname.textContent = partiNome[1]?.charAt(0).toUpperCase() || "";
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
});
gestisciDatiProtetti();
getCurrentUser();
mostraProfilo();
checkAuth();
loadNotification();

function resetFilters() {
  search_input.value = "";
  getOrders("", 1);
  clearFilters.style.display = "none";
}

if (activeLink) {
  current.innerText = "Backups";
  navigation.innerText = `Nexa > Settings > Backups`;
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
  getBackups(search_input.value, page);
}
async function getBackups(search = "", page = 1) {
  try {
    const response = await fetch(
      `${API_URL}/api/auth/getBackups?search=${encodeURIComponent(search)}&page=${page}`,
      {
        credentials: "include",
      },
    );
    if (!response.ok) throw new Error("Errore del server");

    const data = await response.json();

    let tuttoLHtml = "";

    data.backups.forEach((element) => {
      createPagination(data.currentPage, data.totalPages);

      const id = String(element.id).padStart(4, "0");
      const filename = element.name.slice(0, 17) + "...";
      const date = new Date(element.date).toLocaleDateString("it-IT");
      const size = element.size;
      const type = element.type;

      tuttoLHtml += `
            <span style="font-size:12px; color:#635BFF; font-weight:bold">#${id}</span>
           <span style="font-size:12px; color: var(--text-color); font-weight:normal; align-items:start">${filename}</span>
          <span style="font-size:12px; color:grey; font-weight:normal">${date}</span>
          <span style="font-size:12px; color:var(--text-color); font-weight:bold;">${size}</span>
          <span style="font-size:12px; color:var(--text-color); font-weight:bold;">${type}</span>
          <button class="importBtn" data-backup-name="${element.name}" data-backup-type="${element.name}">
            <span style="font-size:12px; color:var(--text-color); font-weight:normal;">Import</span>
          </button>
           <button class="exportBtn" data-backup-name="${element.name}" data-backup-type="${element.name}">
            <span style="font-size:12px; color:var(--text-color); font-weight:normal;">Export</span>
          </button>
          <hr style="grid-column: span 7; border: none; height: 1px; background-color: rgb(225, 225, 230); margin: 5px 0; width: 100%;" />
          `;
    });

    griglia.innerHTML = tuttoLHtml;
    const importBtn = document.querySelectorAll(".importBtn");
    const exportBtn = document.querySelectorAll(".exportBtn");

    importBtn.forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.preventDefault();

        const backupId = button.dataset.backupId;
        const backupName = button.dataset.backupName;
        const backupType = button.dataset.backupType;
        const data = {
          filename: backupName,
          backup_type: backupType,
        };
        try {
          const response = await fetch(`${API_URL}/api/auth/importData`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          if (!response.ok) throw new Error("Import fallito");
          await loadNotification();
          await getBackups();
        } catch (error) {
          console.error("Errore", error);
        }
      });
    });
    exportBtn.forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.preventDefault();

        button.disabled = true;

        try {
          const response = await fetch(`${API_URL}/api/auth/exportBackup`, {
            method: "GET",
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error(
              "Impossibile generare l'esportazione del database.",
            );
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;

          const contentDisposition = response.headers.get(
            "content-disposition",
          );
          let fileName = `backup_db_${new Date().toISOString().slice(0, 10)}.sql`;
          if (contentDisposition && contentDisposition.includes("filename=")) {
            fileName = contentDisposition
              .split("filename=")[1]
              .replace(/"/g, "");
          }

          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          await loadNotification();
          await getBackups();
        } catch (error) {
          console.error("Errore durante lo scaricamento:", error);
          alert(error.message || "Errore di rete durante l'esportazione.");
        } finally {
          button.disabled = false;
        }
      });
    });
  } catch (error) {}
}
getBackups();

search_input.addEventListener("input", () => {
  getBackups(search_input.value, 1);
  clearFilters.style.display = "block";
});
