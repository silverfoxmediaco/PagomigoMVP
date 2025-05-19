document.addEventListener("DOMContentLoaded", () => {
    const navList = document.getElementById("navList");
    if (!navList) return;

    navList.innerHTML = `
      <li><a href="dashboard.html">Dashboard</a></li>
      <li><a href="moneymover.html">Send/Request Money</a></li>
      <li><a href="home.html">Home</a></li>
      <li><a href="#">Settings</a></li>
      <li id="authMenuItem"><a href="login.html">Login</a></li>
    `;

    // Token check to swap Login -> Logout
    const token = localStorage.getItem("token");
    const authItem = document.getElementById("authMenuItem");
    if (authItem) {
      if (token) {
        authItem.innerHTML = `<a href="#">Logout</a>`;
        authItem.addEventListener("click", (e) => {
          e.preventDefault();
          localStorage.removeItem("token");
          window.location.href = "home.html";
        });
      }
    }
  }
);
//
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
//
// Close the menu when clicking outside of it
document.addEventListener("click", (e) => {
  if (!slideoutMenu.contains(e.target) && !hamburger.contains(e.target)) {
    slideoutMenu.classList.remove("open");
  }
});
//
// Close the menu when clicking on a link
const menuLinks = slideoutMenu.querySelectorAll("a");
menuLinks.forEach((link) => {
  link.addEventListener("click", () => {
    slideoutMenu.classList.remove("open");
  });
});
//
// Close the menu when pressing the Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && slideoutMenu.classList.contains("open")) {
    slideoutMenu.classList.remove("open");
  }
});
//
// Close the menu when clicking on the close button
const closeMenuBtn = document.getElementById("closeMenu");
if (closeMenuBtn) {
  closeMenuBtn.addEventListener("click", () => {
    slideoutMenu.classList.remove("open");
  });
}
