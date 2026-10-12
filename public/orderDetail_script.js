const activeLink = document.getElementById("active");
const current = document.getElementById("current_section");
const navigation = document.getElementById("navigation");
const nameCustomer = document.getElementById("name");
const surname = document.getElementById("surname");
const idOrdine = document.getElementById("idOrdine");
const dateOrder = document.getElementById("date");
const statusOrder = document.getElementById("status");
const subtotalText = document.getElementById("subtotal");
const totalText = document.getElementById("total");
const nameCustomerOrder = document.getElementById("nameCustomer");
const surnameCustomer = document.getElementById("surnameCustomer");
const customer = document.getElementById("customer");
const printBtn = document.getElementById("print-btn");
const back = document.getElementById("back");

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

const idOrder = new URLSearchParams(window.location.search).get("id");

back.addEventListener("click", () => {
  window.location.href = "/public/orders.html";
});

if (printBtn) {
  printBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!ordineCorrente) {
      alert("Dati dell'ordine non disponibili.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/auth/getUltimateOrder/${ordineCorrente.id}`,
        {
          credentials: "include",
          method: "GET",
        },
      );

      if (!response.ok) {
        throw new Error("Errore nel recupero dell'ordine dal server");
      }

      const datiRicevuti = await response.json();
      if (datiRicevuti.orders && datiRicevuti.orders.length > 0) {
        ordineCorrente = datiRicevuti.orders[0];
      } else {
        alert("Ordine non trovato nel database.");
        return;
      }
    } catch (errore) {
      console.error(
        "Impossibile recuperare i dati freschi, provo con quelli in memoria:",
        errore,
      );
      alert(
        "Attenzione: Impossibile verificare l'ultimo aggiornamento. La stampa potrebbe contenere dati non aggiornati.",
      );
    }

    generaFattura(ordineCorrente);
  });
}

async function generaFattura(ordine) {
  const prodotti = ordine.products || [];

  if (prodotti.length === 0) {
    alert("Non ci sono prodotti in questo ordine.");
    return;
  }

  const formatEuro = (valore) =>
    new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(Number(valore));

  const formatData = (data) =>
    new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(data));

  const numeroOrdine = String(ordine.id).padStart(4, "0");
  const cliente = ordine.customer || "Cliente";

  const righeProdotti = prodotti
    .map((prodotto) => {
      const quantita = Number(prodotto.quantity);
      const prezzo = Number(prodotto.price);
      const totale = quantita * prezzo;

      return `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; color: #374151;">${prodotto.name}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; color: #374151; text-align: center;">${quantita}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; color: #374151; text-align: right;">${formatEuro(prezzo)}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; color: #374151; text-align: right;">${formatEuro(totale)}</td>
        </tr>
      `;
    })
    .join("");

  const subtotale = prodotti.reduce(
    (somma, prodotto) =>
      somma + Number(prodotto.quantity) * Number(prodotto.price),
    0,
  );

  const sconto = 0;
  const iva = 0;
  const totale = Number(ordine.total || subtotale);

  // 1. Creiamo un contenitore isolato che NON altera il layout della tua pagina
  const container = document.createElement("div");

  // Posizionamento isolato: lo mettiamo in top/left 0 con z-index bassissimo
  // ma con opacità e visibilità attive per permettere la cattura canvas
  container.style.position = "fixed";
  container.style.top = "-9999px"; // Lo spingiamo in alto fuori dalla finestra
  container.style.left = "0";
  container.style.width = "794px"; // Larghezza A4 esatta
  container.style.zIndex = "-9999";

  container.innerHTML = `
    <div id="invoice-pdf" style="width: 794px; min-height: 1123px; padding: 40px; background: #ffffff; font-family: Arial, sans-serif; box-sizing: border-box; color: #1f2937;">
      
      <!-- HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 25px; border-bottom: 1px solid #e5e7eb;">
        <div>
          <div style="font-size: 28px; font-weight: 800; letter-spacing: 1px; color: #1c284e;">NEXA</div>
          <div style="margin-top: 4px; font-size: 11px; color: #6b7280;">Business Management System</div>
        </div>
        <div style="text-align: right;">
          <h1 style="margin: 0 0 6px; font-size: 24px; font-weight: 700; color: #1c284e;"> FATTURA N. ${numeroOrdine}</h1>
          <p style="margin: 2px 0; font-size: 11px; color: #6b7280;">${formatData(ordine.date)}</p>
        </div>
      </div>

      <!-- INFO -->
      <div style="display: flex; justify-content: space-between; padding: 25px 0;">
        <div style="width: 45%;">
          <span style="font-size: 9px; font-weight: 700; color: #9ca3af; letter-spacing: 0.8px;">EMESSA DA</span><br>
          <strong style="font-size: 13px; color: #111827;">Nexa</strong>
          <p style="margin: 2px 0 0; font-size: 10px; color: #6b7280;">Business Management System</p>
        </div>
        <div style="width: 45%;">
          <span style="font-size: 9px; font-weight: 700; color: #9ca3af; letter-spacing: 0.8px;">CLIENTE</span><br>
          <strong style="font-size: 13px; color: #111827;">${cliente}</strong>
          <p style="margin: 2px 0 0; font-size: 10px; color: #6b7280;">Ordine #${numeroOrdine}</p>
        </div>
      </div>

      <!-- STATUS -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; margin-bottom: 25px; background: #f8f9fc; border-radius: 6px;">
        <span style="font-size: 9px; font-weight: 700; color: #6b7280; letter-spacing: 0.7px;">STATO ORDINE</span>
        <strong style="font-size: 10px; color: #1c284e;">${ordine.status}</strong>
      </div>

      <!-- TABELLA -->
      <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 30px;">
        <thead>
          <tr style="background: #1c284e; color: #ffffff;">
            <th style="padding: 10px 8px; font-size: 9px; text-align: left;">PRODOTTO</th>
            <th style="padding: 10px 8px; font-size: 9px; text-align: center;">QTA</th>
            <th style="padding: 10px 8px; font-size: 9px; text-align: right;">PREZZO</th>
            <th style="padding: 10px 8px; font-size: 9px; text-align: right;">TOTALE</th>
          </tr>
        </thead>
        <tbody>
          ${righeProdotti}
        </tbody>
      </table>

      <!-- BOTTOM / TOTALI -->
      <div style="display: flex; justify-content: space-between; margin-top: 30px;">
        <div style="flex: 1;">
          <strong style="font-size: 11px; color: #1c284e;">Grazie per il tuo ordine.</strong>
          <p style="margin-top: 5px; font-size: 9px; color: #9ca3af;">Documento generato automaticamente da Nexa.</p>
        </div>

        <div style="width: 220px;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; padding: 3px 0; color: #6b7280;">
            <span>Subtotale</span>
            <strong style="color: #374151;">${formatEuro(subtotale)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; padding: 3px 0; color: #6b7280;">
            <span>Sconto</span>
            <strong style="color: #374151;">${formatEuro(sconto)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; padding: 3px 0; color: #6b7280;">
            <span>IVA</span>
            <strong style="color: #374151;">${formatEuro(iva)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid #d1d5db;">
            <span style="font-size: 12px; font-weight: 700; color: #111827;">TOTALE</span>
            <strong style="font-size: 16px; font-weight: 800; color: #1c284e;">${formatEuro(totale)}</strong>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div style="margin-top: 80px; padding-top: 15px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 8px; color: #9ca3af;">
        <span>Nexa Business Management System</span>
        <span>Ordine #${numeroOrdine}</span>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  const elementToCapture = container.querySelector("#invoice-pdf");

  const opzioni = {
    margin: 0,
    filename: `Fattura_${numeroOrdine}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  try {
    await html2pdf().set(opzioni).from(elementToCapture).save();
  } catch (err) {
    console.error("Errore generazione PDF:", err);
  } finally {
    container.remove();
  }
}

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
    const response = await fetch("http://localhost:3000/api/auth/me", {
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
async function mostraProfilo() {
  const user = await getCurrentUser();

  const name = document.getElementById("name");
  const surname = document.getElementById("surname");
  const nameComplete = document.getElementById("nameComplete");
  const surnameComplete = document.getElementById("surnameComplete");
  const imgElement = document.getElementById("avatar-img");
  const imgElement2 = document.getElementById("avatar-img2");

  if (user) {
    if (user.avatar) {
      const baseUrl = "http://localhost:3000";
      imgElement.src = baseUrl + user.avatar;
      imgElement.style.display = "block";
      name.style.display = "none";
      surname.style.display = "none";

      /*
      imgElement2.src = baseUrl + user.avatar;
      imgElement2.style.display = "block";
      surnameCustomer.style.display = "none";
      nameCustomerOrder.style.display = "none";
      */
    } else {
      imgElement.style.display = "none";
      name.style.display = "block";
      surname.style.display = "block";
      /*
      imgElement2.style.display = "none";
      surnameCustomer.style.display = "block";
      nameCustomerOrder.style.display = "block";
      */
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
});
gestisciDatiProtetti();
getCurrentUser();
loadNotification();
mostraProfilo();
checkAuth();

if (activeLink) {
  const sectionName = activeLink.querySelector("span").innerText;
  current.innerText = sectionName;
  navigation.innerText = `Nexa > Order Details`;
}

subtotalText.innerText = "€0.00";

let ordineCorrente = null;
let orderId = "";

async function getUltimateOrder() {
  try {
    const response = await fetch(
      `${API_URL}/api/auth/getUltimateOrder/${idOrder}`,
      {
        method: "GET",
        credentials: "include",
      },
    );
    const data = await response.json();
    if (!data.orders || data.orders.length === 0) {
      return;
    }

    const ordine = data.orders[0];
    ordineCorrente = ordine;
    orderId = ordine.id;

    let subtotal = 0;

    idOrdine.innerText = `Order #${String(ordine.id).padStart(4, "0")}`;
    const dateFormat = new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(ordine.date));

    if (ordine.status.toLowerCase() === "pending") {
      document.getElementById("complete-order").style.display = "flex";
      printBtn.style.opacity = "0.3";
      printBtn.style.pointerEvents = "none";
      document.getElementById("cancel-order").style.display = "flex";
    } else {
      if (ordine.status.toLowerCase() === "cancelled") {
        document.getElementById("complete-order").style.display = "none";
        printBtn.style.display = "none";
        document.getElementById("cancel-order").style.display = "none";
      } else {
        document.getElementById("complete-order").style.display = "none";
        printBtn.style.opacity = "1";
        printBtn.style.pointerEvents = "auto";
        document.getElementById("cancel-order").style.display = "none";
      }
    }

    statusOrder.innerText = ordine.status;
    const statusColor =
      ordine.status.toLowerCase() === "completed"
        ? "var(--color-text-completed)"
        : ordine.status.toLowerCase() === "pending"
          ? "var(--color-text-pending)"
          : "var(--color-text-cancelled)";
    const statusColorBg =
      ordine.status.toLowerCase() === "completed"
        ? "var(--bg-button-completed)"
        : ordine.status.toLowerCase() === "pending"
          ? "var(--bg-button-pending)"
          : "var(--bg-button-cancelled)";
    statusOrder.style.color = statusColor;
    document.querySelector(".boxStatus").style.backgroundColor = statusColorBg;
    dateOrder.innerText = dateFormat;

    const name = ordine.customer || "";
    const parti = name.trim().split(" ");

    const nomeGrezzo = parti[0] || "";
    const cognomeGrezzo = parti[1] || "";

    const nomeFormattato =
      nomeGrezzo.charAt(0).toUpperCase() + nomeGrezzo.slice(1).toLowerCase();

    const cognomeFormattato =
      cognomeGrezzo.charAt(0).toUpperCase() +
      cognomeGrezzo.slice(1).toLowerCase();

    const inizialeNomeCustomer = nomeFormattato.charAt(0) || "";
    const inizialeCognomeCustomer = cognomeFormattato.charAt(0) || "";

    nameCustomerOrder.innerText = inizialeNomeCustomer;
    surnameCustomer.innerText = inizialeCognomeCustomer;
    customer.innerText = `${nomeFormattato} ${cognomeFormattato}`;

    const prodottiGriglia = document.querySelector(".prodotti");

    if (prodottiGriglia) {
      prodottiGriglia.innerHTML = "";

      if (ordine.products.length === 0) {
        const html = `
            <span style="display:flex; align-items:center; justify-content:center; color:grey"> Non ci sono prodotti in questo ordine </span>
          `;
        prodottiGriglia.innerHTML += html;
        printBtn.style.opacity = "0.3";
        printBtn.style.pointerEvents = "none";

        return false;
      }

      ordine.products.forEach((element) => {
        const prezzo = new Intl.NumberFormat("it-IT", {
          style: "currency",
          currency: "EUR",
        }).format(element.price);

        const total = new Intl.NumberFormat("it-IT", {
          style: "currency",
          currency: "EUR",
        }).format(Number(element.quantity) * Number(element.price));

        subtotal += Number(element.quantity) * Number(element.price);

        const html = `
            <div class="recapOrdine">
              <div style="display: flex; flex-direction: column; gap: 8px">
                <span class="nomeprodotto" style="font-size: 14px">
                  ${element.name}
                </span>

                <span class="descProdotto" style="font-size: 10px">
                  ${element.quantity} · ${prezzo}
                </span>
              </div>
              <span class="nomeprodotto" style="font-size: 14px">
                  ${total}
                </span>
            </div>
            <hr style="width: 100%; border: none; border-top: 1px solid #dfe3ea; margin: 10px 0;">
          `;

        prodottiGriglia.innerHTML += html;
      });

      const subtotalFormat = new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR",
      }).format(subtotal);
      subtotalText.innerText = subtotalFormat;
      totalText.innerText = subtotalFormat;
    }
  } catch (error) {}
}

async function confirmeOrder() {
  const response = await fetch(`${API_URL}/api/auth/confirmeOrder/${orderId}`, {
    method: "PATCH",
    credentials: "include",
  });

  if (!response.ok) return;
  const statusSpan = document.getElementById("status");
  const statusBox = document.querySelector(".boxStatus");

  if (statusSpan && statusBox) {
    statusSpan.textContent = "Completed";
    statusBox.style.backgroundColor = "var(--bg-button-completed)";
    statusSpan.style.color = "var(--color-text-completed)";
  }

  printBtn.style.opacity = "1";
  printBtn.style.pointerEvents = "auto";

  document.getElementById("complete-order").style.display = "none";
  document.getElementById("cancel-order").style.display = "none";
}
async function cancelOrder() {
  const response = await fetch(`${API_URL}/api/auth/cancelOrder/${orderId}`, {
    method: "PATCH",
    credentials: "include",
  });

  if (!response.ok) return;
  const statusSpan = document.getElementById("status");
  const statusBox = document.querySelector(".boxStatus");

  if (statusSpan && statusBox) {
    statusSpan.textContent = "Cancelled";
    statusBox.style.backgroundColor = "var(--bg-button-cancelled)";
    statusSpan.style.color = "var(--color-text-cancelled)";
  }

  printBtn.style.display = "none";
  document.getElementById("complete-order").style.display = "none";
  document.getElementById("cancel-order").style.display = "none";
}
document
  .getElementById("complete-order")
  .addEventListener("click", confirmeOrder);
document.getElementById("cancel-order").addEventListener("click", cancelOrder);

getUltimateOrder();
