const activeLink = document.getElementById("active");
const current = document.getElementById("current_section");
const navigation = document.getElementById("navigation");
const name = document.getElementById("name");
const surname = document.getElementById("surname");
const griglia = document.getElementById("services");
const search_input = document.getElementById("search-input");
const clearFilters = document.getElementById("clear-filters");
const typeCategory = document.getElementById("typeCategory");
const type = document.getElementById("type");
const typeAvailable = document.getElementById("typeAvailable");
const pagination = document.getElementById("pagination");
const addProduct = document.getElementById("add-product");
const dialog = document.getElementById("addProduct");
const closeDialog = document.getElementById("close-dialog");
const saveProduct = document.getElementById("saveProduct");
const error_form = document.getElementById("error-form");
const container_error = document.querySelector(".container-error");
const cancel = document.getElementById("cancel");
const nameProduct = document.getElementById("nameProduct");
const category = document.getElementById("category");
const price = document.getElementById("price");
const stock = document.getElementById("stock");
const container_errorAdd = document.querySelector(".container-errorAddProduct");
const error_formAdd = document.getElementById("error-formAddProduct");

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
  const services = document.getElementById("services");

  if (!autenticato) {
    elementi.forEach((elemento) => {
      services.style.display = "flex";
      services.style.justifyContent = "center";
      elemento.style.justifyContent = "center";
      elemento.innerHTML = `<i class="fa-solid fa-lock" style="font-size: 24px"></i>`;
      addProduct.style.pointerEvents = "none";
      addProduct.style.opacity = "0.5";
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
      imgElement.src = (/^https?:\/\//i.test(user.avatar) ? user.avatar : baseUrl + user.avatar);
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
gestisciDatiProtetti();
loadNotification();
getCurrentUser();
mostraProfilo();
checkAuth();

cancel.addEventListener("click", () => {
  nameProduct.value = "";
  category.value = "";
  price.value = "";
  stock.value = "";
  error_form.textContent = "";
  error_form.style.display = "none";
  container_error.classList.remove("active");
  container_error.classList.remove("success");
  dialog.close();
});

function validaProdotto() {
  if (
    !nameProduct.value.trim() ||
    !category.value.trim() ||
    !stock.value.trim() ||
    !price.value.trim()
  ) {
    container_errorAdd.classList.add("active");
    container_errorAdd.classList.remove("success");
    error_formAdd.textContent = "Tutti i campi sono obbligatori.";
    error_formAdd.style.display = "block";
    return false;
  } else {
    container_errorAdd.classList.remove("active");
    error_formAdd.textContent = "";
    error_formAdd.style.display = "none";
    return true;
  }
}

addProduct.addEventListener("click", () => {
  if (dialog.open) {
    dialog.close();
  } else {
    dialog.showModal();
  }
});

closeDialog.addEventListener("click", () => {
  nameProduct.value = "";
  category.value = "";
  price.value = "";
  stock.value = "";
  error_form.textContent = "";
  error_form.style.display = "none";
  container_error.classList.remove("active");
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

function resetFilters() {
  typeCategory.value = "All";
  type.value = "All";
  typeAvailable.value = "All";
  clearFilters.style.display = "none";
  search_input.value = "";
  getProducts("", "", "", "", 1);
}

if (activeLink) {
  const sectionName = activeLink.querySelector("span").innerText;
  current.innerText = sectionName;
  navigation.innerText = `Nexa > ${sectionName}`;
}

typeCategory.addEventListener("change", () => {
  const categoryType = typeCategory.value === "All" ? "" : typeCategory.value;
  const typeService = type.value === "All" ? "" : type.value;
  const available = typeAvailable.value === "All" ? "" : typeAvailable.value;
  getProducts(search_input.value, categoryType, typeService, available);
  clearFilters.style.display = "block";
});
type.addEventListener("change", () => {
  const categoryType = typeCategory.value === "All" ? "" : typeCategory.value;
  const typeService = type.value === "All" ? "" : type.value;
  const available = typeAvailable.value === "All" ? "" : typeAvailable.value;
  getProducts(search_input.value, categoryType, typeService, available);
  clearFilters.style.display = "block";
});

typeAvailable.addEventListener("change", () => {
  const categoryType = typeCategory.value === "All" ? "" : typeCategory.value;
  const typeService = type.value === "All" ? "" : type.value;
  const available = typeAvailable.value === "All" ? "" : typeAvailable.value;
  getProducts(search_input.value, categoryType, typeService, available);
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

  const typeService = type.value === "All" ? "" : type.value;
  const available = typeAvailable.value === "All" ? "" : typeAvailable.value;

  getProducts(search_input.value, categoryType, typeService, available, page);
}
async function getProducts(
  search = "",
  categoryType = "",
  typeService = "",
  available = "",
  page = 1,
) {
  try {
    const response = await fetch(
      `${API_URL}/api/auth/getProducts?search=${encodeURIComponent(search)}&categoryType=${encodeURIComponent(categoryType)}&typeService=${typeService}&available=${available}&page=${page}`,
      {
        credentials: "include",
      },
    );
    if (!response.ok) throw new Error("Errore del server");

    const data = await response.json();

    let tuttoLHtml = "";

    data.products.forEach((element) => {
      const colorestato = () => {
        switch (element.availability.toLowerCase()) {
          case "available":
            return "#22C55E";
          case "unavailable":
            return "#FF0000";
          default:
            return "black";
        }
      };

      createPagination(data.currentPage, data.totalPages);

      function truncate(text) {
        if (!text || text.length <= 20) {
          return text;
        }

        return text.slice(0, 22) + "...";
      }

      const item = truncate(element.item);
      const category = element.category;
      const type = element.type;
      const price = new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR",
      }).format(element.price);
      const stock = element.stock;
      const availability = element.availability;

      tuttoLHtml += `
        <div class="product-row" data-id="${element.id || element._id}" style="display: contents;">
              <span style="font-size:12px; color: var(--text-color); font-weight:bold">${item}</span>
            <span style="font-size:12px; color:grey; font-weight:normal; align-items:start">${category}</span>
            <span style="font-size:12px; color:grey; font-weight:bold">${type}</span>
            <span style="font-size:12px; color: var(--text-color; font-weight:bold;">${price}</span>
              <span style="font-size:12px; color:grey; font-weight:normal;">${stock}</span>
            <span style="font-size:12px; color:${colorestato()}; font-weight:bold">${availability}</span>
            <hr style="grid-column: span 6; border: none; height: 1px; background-color: rgb(225, 225, 230); margin: 5px 0; width: 100%;" />
        </div>
          `;
    });

    griglia.innerHTML = tuttoLHtml;
    saveProduct.addEventListener("click", (e) => {
      e.preventDefault();

      if (!validaProdotto()) {
        return;
      }

      const product = {
        name: nameProduct.value.trim(),
        category: category.value.trim(),
        price: Number(price.value.trim()),
        stock: Number(stock.value.trim()),
      };

      fetch(`${API_URL}/api/auth/addProduct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(product),
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
          container_errorAdd.classList.add("active", "success");
          error_formAdd.style.display = "block";
          error_formAdd.textContent =
            "Nuovo prodotto o servizio registrato con successo";

          setTimeout(() => {
            dialog.close();
            error_formAdd.textContent = "";
            error_formAdd.style.display = "none";
            container_errorAdd.classList.remove("active", "success");
          }, 2000);

          // --- SOLUZIONE: AGGIORNA I DATI REALI DAL SERVER ---
          // Richiama la funzione principale per ricaricare la griglia con i dati aggiornati
          getProducts();
          // --------------------------------------------------

          // Resetta i campi del form
          nameProduct.value = "";
          category.value = "";
          price.value = "";
          stock.value = "";

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
  } catch (error) {}
}
getProducts();

search_input.addEventListener("input", () => {
  const categoryType = typeCategory.value === "All" ? "" : typeCategory.value;
  const typeService = type.value === "All" ? "" : type.value;
  const available = typeAvailable.value === "All" ? "" : typeAvailable.value;
  getProducts(search_input.value, categoryType, typeService, available);
  clearFilters.style.display = "block";
});
