// kyc.js
const API_BASE = '';

document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  
  // Check user's KYC status first
  checkKycStatus();
  
  // Elements
  const startPersonaBtn = document.getElementById('start-persona-btn');
  const returnToDashboardBtn = document.getElementById('return-to-dashboard');
  const returnToDashboardVerifiedBtn = document.getElementById('return-to-dashboard-verified');
  
  // Event listeners
  if (startPersonaBtn) {
    startPersonaBtn.addEventListener('click', initiatePersona);
  }
  
  if (returnToDashboardBtn) {
    returnToDashboardBtn.addEventListener('click', returnToDashboard);
  }
  
  if (returnToDashboardVerifiedBtn) {
    returnToDashboardVerifiedBtn.addEventListener('click', returnToDashboard);
  }
  
  // Check if user arrived here from a specific action
  const pendingAction = localStorage.getItem('pendingAction');
  if (pendingAction) {
    // Display custom message based on the pending action
    const introText = document.querySelector('.kyc-intro p:first-of-type');
    if (introText) {
      if (pendingAction === 'send') {
        introText.textContent = 'To send money securely, we need to verify your identity first.';
      } else if (pendingAction === 'request') {
        introText.textContent = 'To receive money, we need to verify your identity first.';
      }
    }
  }
});

async function checkKycStatus() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    const profile = await res.json();
    localStorage.setItem('kycStatus', profile.kyc_status || 'pending');
    
    // If already verified or pending review, show appropriate screen
    if (profile.kyc_status === 'approved') {
      showView('kyc-already-verified');
    } else if (profile.kyc_status === 'pending_review') {
      showView('kyc-complete');
    } else {
      showView('kyc-intro');
    }
  } catch (error) {
    console.error('Error checking KYC status:', error);
    showView('kyc-intro'); // Default to intro view on error
  }
}

function showView(viewId) {
  // Hide all views
  document.querySelectorAll('.kyc-intro, .persona-container, .kyc-complete, .kyc-already-verified')
    .forEach(el => el.classList.add('hidden'));
  
  // Show the requested view
  document.getElementById(viewId).classList.remove('hidden');
}

async function initiatePersona() {
  try {
    // Check if Persona SDK is loaded
    if (!window.Persona) {
      console.error('Persona SDK not loaded');
      alert('The identity verification service is not available. Please refresh the page and try again.');
      return;
    }
    
    // Get the current user's information
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    const user = await res.json();
    
    // Show Persona container and hide intro
    showView('persona-container');
    
    // Initialize Persona client
    const referenceId = user._id.toString ? user._id.toString() : String(user._id);
    console.log('User reference ID for Persona:', referenceId);

    // Use Persona.Client directly (without window) and add environmentId
    const client = new Persona.Client({
      templateId: 'itmpl_pFWFRbSWT9CJkEnSBiAQVdUa6dY6', 
      environmentId: 'env_wXtScja9z97vjkVtQvd6GoTdBPKU', // This should be your actual environment ID
      referenceId: referenceId, // User's unique identifier
      onReady: () => {
        console.log('Persona is ready');
      },
      onComplete: async ({ inquiryId, status, fields }) => {
        console.log('Verification completed:', { inquiryId, status });
        await completeVerification(inquiryId);
      },
      onCancel: () => {
        showView('kyc-intro');
      },
      onError: (error) => {
        console.error('Persona error:', error);
        alert('There was an error with the verification process. Please try again.');
        showView('kyc-intro');
      }
    });
    
    // Just call open() without parameters
    client.open();
    
  } catch (error) {
    console.error('Error initiating Persona:', error);
    alert('Unable to start the verification process. Please try again later.');
    showView('kyc-intro');
  }
}

async function completeVerification(inquiryId) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/persona/complete-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ inquiryId })
    });
    
    if (!res.ok) {
      throw new Error('Failed to complete verification');
    }

    const result = await res.json();
    console.log('Verification result:', result);
    
    // Update local KYC status based on the response
    const newStatus = result.status || 'pending_review';
    localStorage.setItem('kycStatus', newStatus);
    
    // Show completion screen
    showView('kyc-complete');
    
    // After 2 seconds, redirect to dashboard
    setTimeout(() => {
      window.location.href = 'dashboard.html?verification=complete';
    }, 2000);
  } catch (error) {
    console.error('Error completing verification:', error);
    alert('There was an issue submitting your verification. Please contact support.');
  }
}

function returnToDashboard() {
  const pendingAction = localStorage.getItem('pendingAction');
  
  if (pendingAction) {
    localStorage.removeItem('pendingAction');
    if (pendingAction === 'send') {
      window.location.href = 'moneymover.html?action=send';
    } else if (pendingAction === 'request') {
      window.location.href = 'moneymover.html?action=request';
    } else {
      window.location.href = 'dashboard.html';
    }
  } else {
    window.location.href = 'dashboard.html';
  }
}
