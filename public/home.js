// home.js — Join Now Modal + Signup Logic

document.addEventListener("DOMContentLoaded", () => {
  // Burger menu
  /*const hamburger = document.getElementById("hamburger");
  const slideoutMenu = document.getElementById("slideoutMenu");
  const closeBtn = document.getElementById("closeMenu");

  if (hamburger) {
    hamburger.addEventListener("click", () => slideoutMenu.classList.add("open"));
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => slideoutMenu.classList.remove("open"));
  }*/

  // Animate elements on scroll
  const animatedElements = document.querySelectorAll(".debit-card-text, .debit-card-image");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  animatedElements.forEach(el => observer.observe(el));

  // Signup modal
  const modal = document.getElementById("signup-modal");
  const closeSignupBtn = document.getElementById("close-signup");
  const joinNowBtn = document.getElementById("signupbtn");

  if (joinNowBtn) {
    joinNowBtn.addEventListener("click", () => modal.classList.add("active"));
  }

  if (closeSignupBtn) {
    closeSignupBtn.addEventListener("click", () => modal.classList.remove("active"));
  }

  // Signup form
  const signupForm = document.getElementById("signup-form");
  const messageEl = document.getElementById("signup-message");

  // In home.js, update the signup form submission handler
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!document.getElementById("agreeTerms").checked) {
      alert("You must agree to the Terms & Conditions and Privacy Policy.");
      return;
    }

    const name = document.getElementById("name").value;
    const username = document.getElementById("username").value;
    const phone = document.getElementById("phone").value;
    const password = document.getElementById("signup-password").value;

    try {
      console.log("Submitting signup form with data:", { name, username, phone });
      
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, phone, password })
      });
      
      console.log("Response status:", res.status);
      console.log("Response headers:", Object.fromEntries([...res.headers.entries()]));
      
      // Check response type
      const contentType = res.headers.get("content-type");
      console.log("Content-Type:", contentType);
      
      let data;
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await res.json();
          console.log("Parsed JSON response:", data);
        } catch (jsonError) {
          console.error("Error parsing JSON:", jsonError);
          const textResponse = await res.text();
          console.log("Raw text response:", textResponse);
          data = { message: textResponse || "Unknown response" };
        }
      } else {
        // Handle non-JSON response
        const textResponse = await res.text();
        console.log("Raw text response:", textResponse);
        data = { message: textResponse || "Account created!" };
      }
      
      if (!res.ok) {
        messageEl.textContent = data.message || "Signup failed. Try again.";
        return;
      }
      
      messageEl.textContent = data.message || "Account created!";
      localStorage.setItem("phone", phone);
      signupForm.reset();
      
      setTimeout(() => {
        modal.classList.remove("active");
        window.location.href = "/verify.html";
      }, 1500);
    } catch (err) {
      console.error("Signup error:", err);
      messageEl.textContent = "Signup failed. Try again.";
    }
  });
}
});
