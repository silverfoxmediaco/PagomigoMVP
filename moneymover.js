// moneymover.js

document.addEventListener("DOMContentLoaded", () => {
    const sendTab = document.getElementById("sendTab");
    const requestTab = document.getElementById("requestTab");
    const sendSection = document.getElementById("sendSection");
    const requestSection = document.getElementById("requestSection");
  
    // Toggle tabs
    sendTab.addEventListener("click", () => {
      sendTab.classList.add("active");
      requestTab.classList.remove("active");
      sendSection.classList.remove("hidden");
      requestSection.classList.add("hidden");
    });
  
    requestTab.addEventListener("click", () => {
      requestTab.classList.add("active");
      sendTab.classList.remove("active");
      requestSection.classList.remove("hidden");
      sendSection.classList.add("hidden");
    });
  
    // Send Money form submit
    document.getElementById("sendForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("token");
      const form = e.target;
  
      const data = {
        recipientName: form.recipientName.value,
        recipientCountry: form.recipientCountry.value,
        amountUsd: parseFloat(form.amountUsd.value)
      };
  
      try {
        const res = await fetch("/api/transactions/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
  
        const result = await res.json();
        alert(result.message || "Transaction submitted");
        form.reset();
      } catch (err) {
        console.error("Send error:", err);
        alert("An error occurred. Please try again.");
      }
    });
  
    // Request Money form submit
    document.getElementById("requestForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("token");
      const form = e.target;
  
      const data = {
        requestedFrom: form.requestedFrom.value,
        requestNote: form.requestNote.value,
        amountUsd: parseFloat(form.amountUsd.value)
      };
  
      try {
        const res = await fetch("/api/transactions/request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
  
        const result = await res.json();
        alert(result.message || "Request submitted");
        form.reset();
      } catch (err) {
        console.error("Request error:", err);
        alert("An error occurred. Please try again.");
      }
    });
  
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
  });
  