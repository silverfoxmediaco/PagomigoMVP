// logout.js
document.addEventListener("DOMContentLoaded", function() {
    // Define API base URL to match your login.js
    const API_BASE = ''; // Empty string for relative URLs, same as in login.js

    // Handle logout button clicks
    const logoutButtons = document.querySelectorAll(".logout-button");
    
    logoutButtons.forEach(button => {
        button.addEventListener("click", async function(event) {
            event.preventDefault();
            const confirmLogout = confirm("Are you sure you want to log out?");
            
            if (confirmLogout) {
                try {
                    const res = await fetch(`${API_BASE}/api/auth/logout`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    
                    // Remove token regardless of server response
                    localStorage.removeItem('token');
                    
                    if (res.ok) {
                        window.location.href = '/login.html';
                    } else {
                        console.warn("Server returned error on logout, but proceeding with client-side logout");
                        window.location.href = '/login.html';
                    }
                } catch (error) {
                    console.error("Logout error:", error);
                    // Still perform client-side logout even if server request fails
                    localStorage.removeItem('token');
                    window.location.href = '/login.html';
                }
            }
        });
    });

    // Also handle any logout link with ID "logout-btn" for compatibility
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async function(event) {
            event.preventDefault();
            const confirmLogout = confirm("Are you sure you want to log out?");
            
            if (confirmLogout) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
            }
        });
    }
});