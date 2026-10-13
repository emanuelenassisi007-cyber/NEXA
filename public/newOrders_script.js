const activeLink = document.getElementById("active");
const current = document.getElementById("current_section");
const navigation = document.getElementById("navigation");
const nameCustomer = document.getElementById("name");
const surname = document.getElementById("surname");
const griglia = document.querySelector(".grid");
const nomeProdotto = document.querySelector("nomeprodotto");
const prodotto = document.querySelector("descProdotto");
const search = document.getElementById("search-input");
const numberOrder = document.getElementById("nOrder");
const listaOrdine = document.querySelector(".prodotto-ordine");
const message = document.getElementById("alert");
const subtotalText = document.getElementById("subtotal");
const error_form = document.getElementById("error-form");
const container_error = document.querySelector(".container-error");
const totaltext = document.getElementById("total");

const notificationBtn = document.getElementById("notification-btn");
const notificationDropdown = document.getElementById("notification-dropdown");
const notificationList = document.getElementById("notification-list");
const notificationBadge = document.getElementById("notification-badge");
const leggiTutto = document.getElementById("readAll");

let totalOrder = 0;
const completeOrder = document.getElementById("complete");
const savePending = document.getElementById("pending");

let OrderCustomer = "";
listaOrdine.style.display = "none";

let count = 0;
const ordine = {};
let total = 0;

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
    OrderCustomer = document.getElementById("OrderCustomerName").textContent =
      user.full_name.trim();
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
loadNotification();
getCurrentUser();
mostraProfilo();
checkAuth();

if (activeLink) {
  const sectionName = activeLink.querySelector("span").innerText;
  current.innerText = sectionName;
  navigation.innerText = `Nexa > New Order`;
}

let number = 0;

async function getNumberOrder() {
  try {
    const response = await fetch(`${API_URL}/api/auth/getOrders`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    number = data.lastID + 1;
    numberOrder.innerText = `#${String(number).padStart(4, "0")}`;
  } catch (error) {
    console.error("Errore interno del server", error);
  }
}
async function getProdotti(searchProduct = "") {
  try {
    const response = await fetch(
      `${API_URL}/api/auth/getProducts?searchProduct=${encodeURIComponent(searchProduct)}`,
      {
        method: "GET",
        credentials: "include",
      },
    );
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    griglia.innerHTML = "";
    data.query_order.forEach((element) => {
      function truncate(text) {
        if (!text || text.length <= 20) {
          return text;
        }

        return text.slice(0, 22) + "...";
      }

      const nome = truncate(element.item);
      const category = element.category;
      const stock = element.stock;

      const price = new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR",
      }).format(element.price);

      const stockClass = element.stock <= 0 ? "finished" : "";

      const html = `
    <div class="prodotto ${stockClass}" style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 12px; font-family: sans-serif; box-sizing: border-box; width: 100%;">
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <span class="nomeprodotto" style="font-size: 14px; font-weight: bold; color: var(--text-color, #000); line-height: 1.2;">
          ${nome}
        </span>
        <span class="descProdotto" style="font-size: 11px; color: grey;">
          ${category} · ${price}
        </span>
        <span class="descProdotto" style="font-size: 11px; color: grey; margin-top: 4px;">
          Stock: <b>${stock}</b>
        </span>
      </div>

      <a
        class="add-order-btn"
        data-name="${element.item}"
        data-price="${element.price}"
        style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 85px;
          height: 36px;
          background-color: #1e295d; 
          color: #ffffff;
          font-size: 13px;
          font-weight: bold;
          text-decoration: none;
          border-radius: 14px; /* Bordi molto arrotondati */
          cursor: pointer;
          transition: opacity 0.2s ease;
        "
      >
        + Add
      </a>
      
    </div>
  `;

      griglia.innerHTML += html;
    });
  } catch (error) {
    console.error(error);
  }
}

griglia.addEventListener("click", (event) => {
  const button = event.target.closest(".add-order-btn");

  if (!button) return;

  const nome = button.dataset.name;
  const price = Number(button.dataset.price);

  if (ordine[nome]) {
    ordine[nome].count++;
  } else {
    ordine[nome] = {
      price: price,
      count: 1,
    };
  }

  renderOrdine();
});

listaOrdine.addEventListener("click", (event) => {
  const item = event.target.closest(".order-item");

  if (!item) return;

  const nome = item.dataset.name;
  const prezzo = parseFloat(item.dataset.price);

  if (event.target.classList.contains("plus")) {
    ordine[nome].count++;
    total += prezzo;
    renderOrdine();
  }

  if (event.target.classList.contains("minus")) {
    ordine[nome].count--;

    if (ordine[nome].count <= 0) {
      delete ordine[nome];
    }
    total -= prezzo;
    renderOrdine();
  }
});

function renderOrdine() {
  listaOrdine.style.display = "flex";
  listaOrdine.innerHTML = "";
  let subtotal = 0;

  for (const nome in ordine) {
    const prodotto = ordine[nome];

    const count = prodotto.count;
    const price = prodotto.price;

    subtotal += count * price;

    const priceFormatted = new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(price);

    const priceTotal = new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(price * count);

    const html = `
  <div
    class="order-item"
    data-name="${nome}"
    style="
      display: flex;
      width: 100%;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      margin-top: 10px;
    "
  >
    <div style="display: flex; flex-direction: column; gap: 5px">
      <span style="font-size: 14px; font-weight: bold">
        ${nome}
      </span>

      <span class="descProdotto" style="font-size: 10px">
        ${count} x ${priceFormatted}
      </span>
    </div>

    <div
      style="
        display: flex;
        flex-direction: row;
        gap: 10px;
        align-items: center;
      "
    >
      <button class="button plus">+</button>

      <span style="font-size: 14px; font-weight: bold">
        ${priceTotal}
      </span>

      <button class="button minus">-</button>
    </div>
  </div>

  <hr>
`;
    listaOrdine.innerHTML += html;
  }
  if (listaOrdine.children.length === 0) {
    listaOrdine.style.display = "none";
    message.style.display = "block";
  } else {
    message.style.display = "none";
  }
  const subtotalFormat = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(subtotal);
  subtotalText.innerText = subtotalFormat;
  totaltext.innerText = subtotalFormat;
  totalOrder = subtotal;
}

completeOrder.addEventListener("click", (e) => {
  e.preventDefault();
  const carrelloVuoto = Object.keys(ordine).length === 0;
  if (carrelloVuoto) {
    container_error.classList.add("active");
    container_error.classList.remove("success");
    error_form.style.display = "block";
    error_form.textContent =
      "Devi inserire almeno un prodotto per effettuare l'ordine";
    return false;
  }

  const order = {
    customer: OrderCustomer,
    status: "Completed",
    total: totalOrder,
    products: ordine,
  };
  fetch(`${API_URL}/api/auth/addOrders`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Errore dal server" + response.status);
      }
      return response.json();
    })
    .then((data) => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      container_error.classList.add("active");
      container_error.classList.add("success");
      error_form.style.display = "block";
      error_form.textContent = "Ordine effettuato con successo.";
      setTimeout(() => {
        container_error.classList.remove("active");
        container_error.classList.remove("success");
        error_form.style.display = "none";
        error_form.textContent = "";
        window.location.href = `/public/orderDetail.html?id=${number}`;
      }, 3000);
      Object.keys(ordine).forEach((key) => delete ordine[key]);
      renderOrdine();
    })
    .catch((error) => {
      console.error("Si è verificato un problema:", error);
    });
});

savePending.addEventListener("click", (e) => {
  e.preventDefault();
  const carrelloVuoto = Object.keys(ordine).length === 0;

  if (carrelloVuoto) {
    container_error.classList.add("active");
    container_error.classList.remove("success");
    error_form.style.display = "block";
    error_form.textContent =
      "Devi inserire almeno un prodotto per effettuare l'ordine";
    return false;
  }

  const order = {
    customer: OrderCustomer,
    status: "Pending",
    total: totalOrder,
    products: ordine,
  };
  fetch(`${API_URL}/api/auth/addOrders`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Errore dal server" + response.status);
      }
      return response.json();
    })
    .then((data) => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      container_error.classList.add("active");
      container_error.classList.add("success");
      error_form.style.display = "block";
      error_form.textContent =
        "Ordine archiviato con successo. L'ordine è in attesa di conferma";
      setTimeout(() => {
        container_error.classList.remove("active");
        container_error.classList.remove("success");
        error_form.style.display = "none";
        error_form.textContent = "";
        window.location.href = "/public/orders.html";
      }, 3000);
      Object.keys(ordine).forEach((key) => delete ordine[key]);
      renderOrdine();
    })
    .catch((error) => {
      console.error("Si è verificato un problema:", error);
    });
});

const plus = document.querySelector(".plus");
const meno = document.querySelector(".minus");

getProdotti(search.value);
getNumberOrder();
search.addEventListener("input", () => {
  getProdotti(search.value);
});
