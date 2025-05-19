// login.js

const API_BASE = ''; // Empty string for relative URLs

function normalizePhone(input) {
  const digits = input.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? `+${digits}` : `+1${digits}`;
}

// === LOGIN LOGIC ===
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");
  const messageEl = document.getElementById("login-message");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Show loading state
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Logging in...";
      submitBtn.disabled = true;
      messageEl.textContent = "";

      const rawPhone = document.getElementById("login-phone").value;
      const password = document.getElementById("login-password").value;
      const phone = normalizePhone(rawPhone);

      try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, password }),
        });

        const result = await response.json();

        if (response.ok) {
          // Store the JWT token in localStorage
          if (result.token) {
            localStorage.setItem('token', result.token);
          }
          window.location.href = "dashboard.html";
        } else if (response.status === 401 || response.status === 400) {
          messageEl.textContent = "Invalid phone number or password.";
        } else if (response.status === 404) {
          messageEl.textContent = "Account not found. Please sign up.";
        } else {
          messageEl.textContent = result.message || "Login failed.";
        }
      } catch (error) {
        console.error("Login error:", error);
        messageEl.textContent = "Error connecting to the server. Please try again.";
      } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // === FORGOT PASSWORD LOGIC ===
  const forgotPasswordLink = document.getElementById("forgot-password-link");
  const resetModal = document.getElementById("resetPasswordModal");
  const closeResetBtn = document.querySelector(".close-reset-modal");
  const resetStepPhone = document.getElementById("reset-step-phone");
  const resetStepCode = document.getElementById("reset-step-code");
  const resetStepNewPass = document.getElementById("reset-step-newpass");

  let resetPhone = ''; // keep track of phone across steps

  function showStep(stepToShow) {
    [resetStepPhone, resetStepCode, resetStepNewPass].forEach(step =>
      step.classList.add("hidden")
    );
    stepToShow.classList.remove("hidden");
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      resetModal.classList.add("open");
      showStep(resetStepPhone);
    });
  }

  if (closeResetBtn) {
    closeResetBtn.addEventListener("click", () => {
      resetModal.classList.remove("open");
    });
  }

  const resetPhoneForm = document.getElementById("resetPhoneForm");
  const verifyCodeForm = document.getElementById("verifyCodeForm");
  const newPasswordForm = document.getElementById("newPasswordForm");

  if (resetPhoneForm) {
    resetPhoneForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const resetBtn = resetPhoneForm.querySelector('button');
      resetBtn.textContent = "Sending...";
      resetBtn.disabled = true;
      
      resetPhone = normalizePhone(document.getElementById("reset-phone").value);

      try {
        const res = await fetch(`${API_BASE}/api/auth/request-reset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: resetPhone }),
        });

        const result = await res.json();
        if (res.ok) {
          alert("Verification code sent.");
          showStep(resetStepCode);
        } else {
          alert(result.message || "Failed to send code.");
        }
      } catch (error) {
        alert("Error connecting to server. Please try again.");
      } finally {
        resetBtn.textContent = "Send Code";
        resetBtn.disabled = false;
      }
    });
  }

  if (verifyCodeForm) {
    verifyCodeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const verifyBtn = verifyCodeForm.querySelector('button');
      verifyBtn.textContent = "Verifying...";
      verifyBtn.disabled = true;
      
      const code = document.getElementById("reset-code").value;

      try {
        const res = await fetch(`${API_BASE}/api/auth/verify-reset-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: resetPhone, code }),
        });

        const result = await res.json();
        if (res.ok) {
          // Store reset token if provided
          if (result.resetToken) {
            localStorage.setItem('resetToken', result.resetToken);
          }
          alert("Phone verified. Please set your new password.");
          showStep(resetStepNewPass);
        } else {
          alert(result.message || "Code verification failed.");
        }
      } catch (error) {
        alert("Error connecting to server. Please try again.");
      } finally {
        verifyBtn.textContent = "Verify";
        verifyBtn.disabled = false;
      }
    });
  }

  if (newPasswordForm) {
    newPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const updateBtn = newPasswordForm.querySelector('button');
      updateBtn.textContent = "Updating...";
      updateBtn.disabled = true;
      
      const newPassword = document.getElementById("new-password").value;
      const resetToken = localStorage.getItem('resetToken');

      try {
        const res = await fetch(`${API_BASE}/api/auth/update-password`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": resetToken ? `Bearer ${resetToken}` : ''
          },
          body: JSON.stringify({ phone: resetPhone, newPassword }),
        });

        const result = await res.json();
        if (res.ok) {
          localStorage.removeItem('resetToken'); // Clean up
          alert("Password updated! You can now log in.");
          resetModal.classList.remove("open");
        } else {
          alert(result.message || "Failed to update password.");
        }
      } catch (error) {
        alert("Error connecting to server. Please try again.");
      } finally {
        updateBtn.textContent = "Update Password";
        updateBtn.disabled = false;
      }
    });
  }
});

/*/ Burger menu logic
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

// Close menu logic
const menuLinks = slideoutMenu?.querySelectorAll("a") || [];
menuLinks.forEach(link => {
  link.addEventListener("click", () => {
    slideoutMenu.classList.remove("open");
  });
});

document.addEventListener("click", (e) => {
  if (slideoutMenu && !slideoutMenu.contains(e.target) && !hamburger.contains(e.target)) {
    slideoutMenu.classList.remove("open");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && slideoutMenu && slideoutMenu.classList.contains("open")) {
    slideoutMenu.classList.remove("open");
  }
});*/
