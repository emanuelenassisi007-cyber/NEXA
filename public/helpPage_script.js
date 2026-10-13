const activeLink = document.getElementById("active");
const current = document.getElementById("current_section");
const navigation = document.getElementById("navigation");
const nameCustomer = document.getElementById("name");
const surname = document.getElementById("surname");
const viewGuide = document.getElementById("viewGuide");
const notificationBtn = document.getElementById("notification-btn");
const notificationDropdown = document.getElementById("notification-dropdown");
const notificationList = document.getElementById("notification-list");
const notificationBadge = document.getElementById("notification-badge");
const leggiTutto = document.getElementById("readAll");
const readAll = document.getElementById("readAllNotif");
const info1 = document.getElementById("info1");
const popup = document.getElementById("viewGuide");
const overlay = document.getElementById("dialogOverlay");

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

info1.addEventListener("click", () => {
  viewGuide.style.display = "block";
});
gestisciDatiProtetti();
getCurrentUser();
mostraProfilo();
checkAuth();
loadNotification();

if (activeLink) {
  const sectionName = activeLink.querySelector("span").innerText;
  current.innerText = sectionName;
  navigation.innerText = `Nexa > ${sectionName}`;
}

const questions = document.querySelectorAll(".question");

questions.forEach((question) => {
  question.addEventListener("click", () => {
    const response = question.nextElementSibling;
    const iconArrow = question.querySelector(".iconArrow");

    const isAlreadyOpen = response.classList.contains("show");

    questions.forEach((otherQuestion) => {
      const otherResponse = otherQuestion.nextElementSibling;
      const otherIcon = otherQuestion.querySelector(".iconArrow");

      otherResponse.classList.remove("show");
      otherIcon.innerHTML = `<i class="fa-solid fa-sort-down"></i>`;
    });

    if (!isAlreadyOpen) {
      response.classList.add("show");
      iconArrow.innerHTML = `<i class="fa-solid fa-sort-up"></i>`;
    }
  });
});
function toggleFaq(elemento) {
  elemento.classList.toggle("attiva");
}

function filtraLeGuide() {
  // 1. Prendi il testo inserito dall'utente
  const testoCercato = document
    .getElementById("searchInput")
    .value.toLowerCase();

  // ==========================================
  // FILTRO GUIDE (COLONNA SINISTRA)
  // ==========================================
  const righeGuide = document.querySelectorAll(".guida-item");
  let guideTrovate = 0;

  righeGuide.forEach((riga) => {
    const chiaveGuida = riga.getAttribute("data-guida");
    const datiGuida = testiGuide[chiaveGuida];

    if (datiGuida) {
      const testoCompletoGuida = (
        datiGuida.titolo +
        " " +
        datiGuida.html
      ).toLowerCase();

      if (testoCompletoGuida.includes(testoCercato)) {
        riga.style.display = "flex";
        guideTrovate++;
      } else {
        riga.style.display = "none";
      }
    }
  });

  // Gestione messaggio "Nessun risultato" per le guide
  const messaggioErroreGuide = document.getElementById("nessun-risultato");
  if (guideTrovate === 0 && testoCercato !== "") {
    messaggioErroreGuide.style.display = "block";
  } else {
    messaggioErroreGuide.style.display = "none";
  }

  // ==========================================
  // FILTRO FAQ (COLONNA DESTRA)
  // ==========================================
  const elementiFaq = document.querySelectorAll(".faq-item");
  let faqTrovate = 0;

  elementiFaq.forEach((faq) => {
    // Prende tutto il testo visibile e nascosto all'interno dell'intero blocco FAQ
    const testoFaq = faq.textContent.toLowerCase();

    if (testoFaq.includes(testoCercato)) {
      faq.style.display = "block"; // Mostra la FAQ se c'è corrispondenza
      faqTrovate++;
    } else {
      faq.style.display = "none"; // Nasconde la FAQ se non c'è corrispondenza
    }
  });

  // Gestione messaggio "Nessun risultato" per le FAQ
  const messaggioErroreFaq = document.getElementById("nessun-risultato-faq");
  if (faqTrovate === 0 && testoCercato !== "") {
    if (messaggioErroreFaq) messaggioErroreFaq.style.display = "block";
  } else {
    if (messaggioErroreFaq) messaggioErroreFaq.style.display = "none";
  }
}

const testiGuide = {
  nexa: {
    titolo: "Getting started with Nexa",
    html: `
            <div
        style="
          font-size: 14px;
          color: grey;
          line-height: 1.6;
          margin-bottom: 24px;
        "
      >
        <p style="margin-top: 0; margin-bottom: 16px">
          <b>Welcome to Nexa</b>, your workspace for managing customers,
          products, orders, appointments, and more.
        </p>

        <div style="margin-bottom: 16px">
          <h3
            style="
              margin: 0 0 4px 0;
              font-size: 15px;
              font-weight: 600;
              color: var(--text-color);
            "
          >
            Getting started
          </h3>
          <p style="margin: 0">
            After logging in, use the sidebar to navigate between the different
            sections of the dashboard.
          </p>
        </div>

        <div style="margin-bottom: 16px">
          <h3
            style="
              margin: 0 0 4px 0;
              font-size: 15px;
              font-weight: 600;
              color: var(--text-color);
            "
          >
            Your first customer
          </h3>
          <p style="margin: 0">
            Go to <b>Customers</b> and select <b>Add customer</b>. Enter the
            required information and save the record.
          </p>
        </div>

        <div style="margin-bottom: 16px">
          <h3
            style="
              margin: 0 0 4px 0;
              font-size: 15px;
              font-weight: 600;
              color: var(--text-color);
            "
          >
            Products & Orders
          </h3>
          <p style="margin: 0; margin-bottom: 8px">
            Open <b>Products & Services</b> to create products or services, set
            their prices, availability, and details.
          </p>
          <p style="margin: 0">
            Go to <b>Orders</b> and create a new order by entering the customer,
            date, status, and total.
          </p>
        </div>

        <div style="margin-bottom: 16px">
          <h3
            style="
              margin: 0 0 4px 0;
              font-size: 15px;
              font-weight: 600;
              color: var(--text-color);
            "
          >
            Stay organized
          </h3>
          <p style="margin: 0">
            Use the search bars, filters, notifications, and dashboard tools to
            keep your workspace organized and up to date.
          </p>
        </div>

        <p
          style="
            margin: 16px 0 0 0;
            padding: 12px;
            border-radius: 8px;
            border-left: 4px solid #635bff;
            border-right: 4px solid #635bff;
            font-size: 13px;
          "
        >
          💡 <b style="color: var(--text-color)">Tip:</b> You can manage your
          account, security, notifications, and other preferences from
          <b>Settings</b>.
        </p>
      </div>
    `,
  },
  customers: {
    titolo: "Managing customers",
    html: `
      <div style="font-size: 14px; color: grey; line-height: 1.6; margin-bottom: 24px;">
        <p style="margin-top: 0; margin-bottom: 16px">
          The <b>Customers</b> section lets you keep all your customer information organized in one place.
        </p>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Add a customer</h3>
          <p style="margin: 0">Select <b>Add customer</b> and enter the customer’s name, email, phone number, and status.</p>
        </div>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Search customers</h3>
          <p style="margin: 0">Use the search bar to quickly find a specific customer.</p>
        </div>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Edit customer information</h3>
          <p style="margin: 0">Open a customer record and select <b>Edit</b> to update their information.</p>
        </div>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Delete a customer</h3>
          <p style="margin: 0">Use the delete option available on the customer record. Make sure the information is no longer needed before confirming.</p>
        </div>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Keep information up to date</h3>
          <p style="margin: 0">Regularly update customer details so that your records remain accurate and useful.</p>
        </div>
      </div>
    `,
  },
  products: {
    titolo: "Products and services",
    html: `
      <div style="font-size: 14px; color: grey; line-height: 1.6; margin-bottom: 24px;">
        <p style="margin-top: 0; margin-bottom: 16px">
          Use the <b>Products & Services</b> section to manage the items and services available in your business.
        </p>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Add a product or service</h3>
          <p style="margin: 0">Select <b>Add product</b> and enter the item name, category, type, price, availability, and stock when applicable.</p>
        </div>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Products vs services</h3>
          <p style="margin: 0">When creating an item, choose whether it is a <b>Product</b> or a <b>Service</b>.</p>
        </div>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Manage stock</h3>
          <p style="margin: 0">Products can include a stock quantity. Keep this information updated to monitor availability.</p>
        </div>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Update prices</h3>
          <p style="margin: 0">Edit an existing item whenever you need to change its price or other information.</p>
        </div>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Availability</h3>
          <p style="margin: 0">Use the availability status to indicate whether an item is currently available.</p>
        </div>
      </div>
    `,
  },
  orders: {
    titolo: "Orders and appointments",
    html: `
      <div style="font-size: 14px; color: grey; line-height: 1.6; margin-bottom: 24px;">
        <p style="margin-top: 0; margin-bottom: 16px">
          The <b>Orders & Appointments</b> section helps you manage transactions and scheduled activities from one place.
        </p>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Create an order</h3>
          <p style="margin: 0">Select <b>New order</b>, choose the customer, enter the date, status, and total, then save the order.</p>
        </div>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Manage order status</h3>
          <p style="margin: 0">Orders can be marked as <b>Completed</b>, <b>Pending</b>, or <b>Cancelled</b>.</p>
        </div>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Order items</h3>
          <p style="margin: 0">Order items allow you to keep track of the products or services included in an order, including quantity and price.</p>
        </div>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Create an appointment</h3>
          <p style="margin: 0">Go to Appointments and select <b>New appointment</b>. Enter the title, client, date, start time, end time, and status.</p>
        </div>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Appointment status</h3>
          <p style="margin: 0">Appointments can be marked as <b>Confirmed</b>, <b>Pending</b>, or <b>Cancelled</b>.</p>
        </div>
        <p style="margin: 16px 0 0 0; padding: 12px; border-radius: 8px; border-left: 4px solid #635bff; border-right: 4px solid #635bff; font-size: 13px;">
          💡 <b style="color: var(--text-color)">Tip:</b> Keep orders and appointments updated so your dashboard always reflects the current state of your business.
        </p>
      </div>
    `,
  },
  account: {
    titolo: "Account & security",
    html: `
      <div style="font-size: 14px; color: grey; line-height: 1.6; margin-bottom: 24px;">
        <p style="margin-top: 0; margin-bottom: 16px">
          Use <b>Settings → Security</b> to manage the security of your Nexa account.
        </p>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Change your password</h3>
          <p style="margin: 0">Enter your current password, choose a new password, and confirm the change.</p>
        </div>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Two-factor authentication</h3>
          <p style="margin: 0">Enable <b>Two-Factor Authentication (2FA)</b> to add an additional layer of protection to your account.</p>
        </div>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Sessions and account security</h3>
          <p style="margin: 0">Keep your account information secure and never share your password or authentication codes with other people.</p>
        </div>
        <div style="margin-bottom: 16px">
          <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">Password recovery</h3>
          <p style="margin: 0">If you forget your password, use the <b>Forgot password</b> option on the login page to start the recovery process.</p>
        </div>
      </div>
    `,
  },
  backups: {
    titolo: "Backups & data",
    html: `
      <p style="margin-top: 0; margin-bottom: 16px">
        Nexa provides tools to help protect and manage your business data.
      </p>

      <div style="margin-bottom: 16px">
        <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">
          Create a backup
        </h3>
        <p style="margin: 0">
          Administrators can create a database backup from the Backups section.
        </p>
      </div>

      <div style="margin-bottom: 16px">
        <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">
          Automatic backups
        </h3>
        <p style="margin: 0">
          If enabled, Nexa can automatically create backups according to the configured settings.
        </p>
      </div>

      <div style="margin-bottom: 16px">
        <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">
          Export your data
        </h3>
        <p style="margin: 0">
          Use <b>Export my data</b> to download the data available to your account in an Excel file.
        </p>
      </div>

      <div style="margin-bottom: 16px">
        <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">
          Keep your data safe
        </h3>
        <p style="margin: 0">
          Backups should be stored securely and should not be exposed through public folders or shared with unauthorized users.
        </p>
      </div>

      <p style="margin: 16px 0 0 0; padding: 12px; border-radius: 8px; border-left: 4px solid #635bff; border-right: 4px solid #635bff; font-size: 13px;">
        💡 <b style="color: var(--text-color)">Tip:</b> Regular backups can help you recover your data in case of accidental deletion or technical problems.
      </p>
    `,
  },
  notifications: {
    titolo: "Notifications",
    html: `
      <p style="margin-top: 0; margin-bottom: 16px">
        Nexa uses notifications to keep you informed about important events in your workspace.
      </p>

      <div style="margin-bottom: 16px">
        <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">
          In-app notifications
        </h3>
        <p style="margin: 0">
          New notifications appear directly in Nexa and can be marked as read when you have reviewed them.
        </p>
      </div>

      <div style="margin-bottom: 16px">
        <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">
          Important notifications
        </h3>
        <p style="margin: 0">
          Some notifications may be marked as <b>Important</b> and can require additional attention.
        </p>
      </div>

      <div style="margin-bottom: 16px">
        <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">
          Email notifications
        </h3>
        <p style="margin: 0">
          If email notifications are enabled in Settings, important notifications can also be sent to your account email address.
        </p>
      </div>

      <div style="margin-bottom: 16px">
        <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: var(--text-color);">
          Notification preferences
        </h3>
        <p style="margin: 0">
          You can manage your notification settings from your account preferences.
        </p>
      </div>

      <p style="margin: 16px 0 0 0; padding: 12px; border-radius: 8px; border-left: 4px solid #635bff; border-right: 4px solid #635bff; font-size: 13px;">
        💡 <b style="color: var(--text-color)">Tip:</b> Keep important notifications enabled so you don’t miss relevant activity.
      </p>
    `,
  },
};
function apriLaGuida(tipo) {
  const guida = testiGuide[tipo];

  if (guida) {
    document.getElementById("titolo-guida").textContent = guida.titolo;
    document.getElementById("contenuto-guida").innerHTML = guida.html;

    popup.style.display = "block";
    overlay.style.display = "block";
    document.body.style.overflow = "hidden";
  }
}
function chiudiIlPopup() {
  popup.style.display = "none";
  overlay.style.display = "none";
  document.body.style.overflow = "auto";
}
