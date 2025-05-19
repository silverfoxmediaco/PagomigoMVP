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

// Fetch user profile
async function loadDashboard() {
  try {
    const token = localStorage.getItem('token');

    const res = await fetch("/api/user/profile", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const profile = await res.json();

    document.getElementById("user-name").textContent = profile.name;
    document.getElementById("user-email").textContent = profile.email;
    document.getElementById("user-kyc").textContent = profile.kyc_status;

    if (!profile.phoneVerified) {
      alert("Please verify your phone to continue.");
      window.location.href = "/home.html";
      return;
    }

  } catch (err) {
    console.error("Dashboard load error:", err);
    window.location.href = "/home.html"; // redirect if fetch fails
  }
}

if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", loadDashboard);
} else {
  loadDashboard();
}

async function loadDashboardProfile() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = "/login.html";
      return;
    }
    const response = await fetch("/api/user/profile", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    console.log(data);
    document.getElementById("user-name").textContent = data.name;
    document.getElementById("user-email").textContent = data.email;
    document.getElementById("user-kyc").textContent = data.kyc_status;
    document.getElementById("user-phone").textContent = data.phone;
    document.getElementById("user-address").textContent = data.address;
    document.getElementById("user-balance").textContent = data.balance;
    document.getElementById("user-kyc-status").textContent = data.kyc_status;

    const kycBanner = document.getElementById("kyc-banner");
    if (kycBanner) {
      if (data.kyc_status === "verified") {
        kycBanner.style.display = "none";
      } else {
        kycBanner.style.display = "block";
      }
    }
  }
  catch (error) {
    console.error("Error fetching profile:", error);
  }
}

// Call the function when the DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", loadDashboardProfile);
} else {
  loadDashboardProfile();
}