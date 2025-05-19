// Burger menu logic
const hamburger = document.getElementById("hamburger");
const slideoutMenu = document.getElementById("slideoutMenu");
const closeBtn = document.getElementById("closeMenu");

if (hamburger) {
  hamburger.addEventListener("click", () => {
    slideoutMenu.classList.add("open");
  });
}

if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    slideoutMenu.classList.remove("open");
  });
}

// Login logic
const loginForm = document.getElementById("login-form");
const loginMsg = document.getElementById("login-message");
const logoutBtn = document.getElementById("logoutBtn");

const token = localStorage.getItem("token");

// Show/hide login/logout controls
if (token && logoutBtn) {
  logoutBtn.style.display = "inline-block";
  if (loginForm) loginForm.style.display = "none";
} else if (loginForm) {
  loginForm.style.display = "block";
  if (logoutBtn) logoutBtn.style.display = "none";
}

// Login form handler
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password })
      });

      const data = await res.json();
      loginMsg.textContent = data.message;

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        window.location.href = "/dashboard.html";
      }
    } catch (err) {
      console.error(err);
      loginMsg.textContent = "Login failed. Try again.";
    }
  });
}

// Logout button handler
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/home.html";
  });
}