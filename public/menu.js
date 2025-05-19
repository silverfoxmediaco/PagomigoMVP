console.log('Menu.js starting, Token in localStorage:', !!localStorage.getItem ('token'));
document.addEventListener("DOMContentLoaded", () => {
  const navList = document.getElementById("navList");
  if (navList) {
    navList.innerHTML = `
      <li><a href="dashboard.html">Dashboard</a></li>
      <li><a href="moneymover.html">Send/Request Money</a></li>
      <li><a href="home.html">Home</a></li>
      <li><a href="#">Settings</a></li>
      <li><a href="billpay.html">Bill Pay</a></li>
      <li id="authMenuItem"><a href="login.html">Login</a></li>
    `;

    // Token check to swap Login -> Logout
    const token = localStorage.getItem("token");
    console.log('Token value retrieved:', token ? 'Token exists' : 'No token');
    const authItem = document.getElementById("authMenuItem");
    if (authItem && token) {
      console.log('Updating auth menu item to Logout');
      // Create logout link with the correct class for our logout.js
      authItem.innerHTML = `<a href="#" class="logout-button">Logout</a>`;
      
      // We'll let logout.js handle the logout functionality
      // But keep this as a fallback
      const logoutLink = authItem.querySelector("a");
      logoutLink.addEventListener("click", (e) => {
        // If logout.js hasn't attached its event handler yet, handle logout here
        if (!e.defaultPrevented) {
          e.preventDefault();
          try {
            // Try to call the logout API
            fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            }).catch(err => console.warn('Logout API error:', err));
            
            // Remove token and redirect regardless of API response
            localStorage.removeItem("token");
            window.location.href = "login.html";
          } catch (error) {
            console.error('Logout error:', error);
            // Still perform client-side logout
            localStorage.removeItem("token");
            window.location.href = "login.html";
          }
        }
      });
    }
  }

  // === Burger Menu Logic ===
  const hamburger = document.getElementById("hamburger");
  const slideoutMenu = document.getElementById("slideoutMenu");
  const closeBtn = document.getElementById("closeMenu");

  if (hamburger && slideoutMenu) {
    hamburger.addEventListener("click", () => {
      slideoutMenu.classList.add("open");
    });

    document.addEventListener("click", (e) => {
      if (!slideoutMenu.contains(e.target) && !hamburger.contains(e.target)) {
        slideoutMenu.classList.remove("open");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && slideoutMenu.classList.contains("open")) {
        slideoutMenu.classList.remove("open");
      }
    });

    const menuLinks = slideoutMenu.querySelectorAll("a");
    menuLinks.forEach((link) => {
      link.addEventListener("click", () => {
        slideoutMenu.classList.remove("open");
      });
    });
  }

  if (closeBtn && slideoutMenu) {
    closeBtn.addEventListener("click", () => {
      slideoutMenu.classList.remove("open");
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    console.log('FINAL CHECK - Auth menu contents:', document.getElementById('authMenuItem')?.innerHTML || 'Not found');
  }, 500);
});