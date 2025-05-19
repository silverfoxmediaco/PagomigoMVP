const API_BASE = 'https://pagomigo.com';

document.addEventListener("DOMContentLoaded", function () {
  const signupForm = document.getElementById("signup-form");
  const messageEl = document.getElementById("message");

  if (!signupForm) return;

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const username = document.getElementById("username").value;
    const rawPhone = document.getElementById("signup-phone").value;
    const password = document.getElementById("signup-password").value;

    const phone = normalizePhone(rawPhone); // 🔄 Format to +1XXXXXXXXXX

    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, username, phone, password }),
      });

      const result = await response.json();
      messageEl.textContent = result.message;

      if (response.ok) {
        signupForm.reset();
        alert("Signup successful! Please check your phone for a verification code.");
        // Optional: redirect to verification modal/page
        // window.location.href = "verify.html";
      }

    } catch (error) {
      console.error("Signup error:", error);
      messageEl.textContent = "Error signing up. Please try again later.";
    }
  });

  function normalizePhone(input) {
    const digits = input.replace(/\D/g, '');
    return digits.length === 11 && digits.startsWith('1')
      ? `+${digits}`
      : `+1${digits}`;
  }
});
