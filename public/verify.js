// verify.js

document.addEventListener("DOMContentLoaded", () => {
  const verifyForm = document.getElementById("verifyForm");
  const messageEl = document.getElementById("verify-message");
  const phone = localStorage.getItem("phone");

  if (!phone) {
    messageEl.textContent = "Phone number not found. Please sign up again.";
    return;
  }

  verifyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = document.getElementById("verificationCode").value.trim();

    if (code.length !== 6) {
      messageEl.textContent = "Please enter a valid 6-digit code.";
      return;
    }

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ phone, code })
      });

      const result = await res.json();

      if (res.ok) {
        messageEl.textContent = "Phone verified! Redirecting...";
        
        if (result.token) {
          localStorage.setItem("token", result.token);
        }
        localStorage.removeItem("phone");
        setTimeout(() => window.location.href = "/dashboard.html", 1500);
      } else {
        messageEl.textContent = result.message || "Verification failed.";
      }
    } catch (err) {
      console.error("Verification error:", err);
      messageEl.textContent = "Server error. Please try again.";
    }
  });
});

console.log("Loaded latest verify.js");



//Old Code
/*document.addEventListener("DOMContentLoaded", () => {
    const verifyForm = document.getElementById("verifyForm");
    const messageEl = document.getElementById("verify-message");
   // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  
    if (verifyForm) {
      verifyForm.addEventListener("submit", async (e) => {
        e.preventDefault();
  
        const code = document.getElementById("verificationCode").value;
        const phone = localStorage.getItem("phone"); // Assuming phone is stored in localStorage after sending the verification code
  
        if (!phone) {
          messageEl.textContent = "Phone number missing from session.";
          return;
        }
  
        try {
          const res = await fetch("/api/auth/verify-code", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ phone, code })
          });
  
          const data = await res.json();
  
          if (res.ok) {
            messageEl.textContent = data.message || "Phone verified!";
            setTimeout(() => {
              window.location.href = "/dashboard.html";
            }, 2000);
          } else {
            messageEl.textContent = data.message || "Verification failed.";
          }
        } catch (err) {
          console.error("Verification error:", err);
          messageEl.textContent = "An error occurred. Try again.";
        }
      });
    }
  });*/


  
