document.addEventListener("DOMContentLoaded", () => {
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
  
    // Animation logic
    const animatedElements = document.querySelectorAll(".debit-card-text, .debit-card-image");
  
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target); // animate once
        }
      });
    }, { threshold: 0.1 });
  
    animatedElements.forEach(el => observer.observe(el));
  });

  // join now modal
  document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("signup-modal");
    const closeBtn = document.getElementById("close-signup");
    const joinNowBtn = document.getElementById("signupbtn");
  
    if (joinNowBtn) {
      joinNowBtn.addEventListener("click", () => {
        modal.classList.add("active");
      });
    }
  
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.classList.remove("active");
      });
    }
  
    const signupForm = document.getElementById("signup-form");
    const messageEl = document.getElementById("signup-message");
  
    if (signupForm) {
      signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
  
        const name = document.getElementById("name").value;
        const username = document.getElementById("username").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
  
        try {
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, username, email, password })
          });
  
          const data = await res.json();
          messageEl.textContent = data.message || "Account created!";
          if (res.ok) {
            signupForm.reset();
            setTimeout(() => modal.classList.remove("active"), 2000);
          }
        } catch (err) {
          console.error(err);
          messageEl.textContent = "Signup failed. Try again.";
        }
      });
    }
  });
  
  
