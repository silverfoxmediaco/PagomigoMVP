// moneymover.js

// API base URL
const API_BASE = '';

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Initialize UI elements
  initializeUI();

  // Check KYC status
  checkKycStatus();
  
  // Check Unit account status
  checkUnitAccount();
  
  // Fetch user balance
  fetchUserBalance();
  
  // Handle tab switching
  initializeTabs();
  
  // Initialize form handlers
  initializeFormHandlers();
});

// Initialize UI elements
function initializeUI() {
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
  }*/
  
  // Check URL parameters to set initial tab
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  
  if (action === 'send' && document.getElementById('sendTab')) {
    document.getElementById('sendTab').click();
  } else if (action === 'request' && document.getElementById('requestTab')) {
    document.getElementById('requestTab').click();
  } else if (action === 'unit' && document.getElementById('unitSendTab')) {
    document.getElementById('unitSendTab').click();
  }
}

// Initialize tabs
function initializeTabs() {
  const sendTab = document.getElementById('sendTab');
  const requestTab = document.getElementById('requestTab');
  const unitSendTab = document.getElementById('unitSendTab');
  
  const sendSection = document.getElementById('sendSection');
  const requestSection = document.getElementById('requestSection');
  const unitSendSection = document.getElementById('unitSendSection');
  
  if (sendTab && requestTab && unitSendTab) {
    // Send tab click
    sendTab.addEventListener('click', () => {
      sendTab.classList.add('active');
      requestTab.classList.remove('active');
      unitSendTab.classList.remove('active');
      
      sendSection.classList.remove('hidden');
      requestSection.classList.add('hidden');
      unitSendSection.classList.add('hidden');
    });
    
    // Request tab click
    requestTab.addEventListener('click', () => {
      sendTab.classList.remove('active');
      requestTab.classList.add('active');
      unitSendTab.classList.remove('active');
      
      sendSection.classList.add('hidden');
      requestSection.classList.remove('hidden');
      unitSendSection.classList.add('hidden');
    });
    
    // Unit Send tab click
    unitSendTab.addEventListener('click', () => {
      sendTab.classList.remove('active');
      requestTab.classList.remove('active');
      unitSendTab.classList.add('active');
      
      sendSection.classList.add('hidden');
      requestSection.classList.add('hidden');
      unitSendSection.classList.remove('hidden');
      
      // Check if user has Unit account when switching to Unit tab
      checkUnitAccount();
    });
  }
}

// Initialize form handlers
function initializeFormHandlers() {
  const sendForm = document.getElementById('sendForm');
  const requestForm = document.getElementById('requestForm');
  const unitSendForm = document.getElementById('unitSendForm');
  const setupUnitAccountBtn = document.getElementById('setup-unit-account-btn');
  
  // Traditional send form
  if (sendForm) {
    sendForm.addEventListener('submit', handleSendMoney);
  }
  
  // Request money form
  if (requestForm) {
    requestForm.addEventListener('submit', handleRequestMoney);
  }
  
  // Unit send form
  if (unitSendForm) {
    unitSendForm.addEventListener('submit', handleUnitSendMoney);
  }
  
  // Setup Unit account button
  if (setupUnitAccountBtn) {
    setupUnitAccountBtn.addEventListener('click', setupUnitAccount);
  }
}

// Check KYC status
async function checkKycStatus() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }
    
    const res = await fetch(`${API_BASE}/api/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const user = await res.json();
      const kycStatus = user.kyc_status || 'pending';
      localStorage.setItem('kycStatus', kycStatus);
      
      // Check if KYC is approved
      if (kycStatus !== 'approved') {
        addKycWarningBanner();
        disableTransactionButtons();
      }
    }
  } catch (error) {
    console.error('Error checking KYC status:', error);
  }
}

// Check if user has a Unit account
async function checkUnitAccount() {
  try {
    const token = localStorage.getItem('token');
    const noUnitAccountEl = document.getElementById('no-unit-account');
    
    const response = await fetch(`${API_BASE}/api/unit/accounts/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 404) {
      // User doesn't have a Unit account
      if (noUnitAccountEl) {
        noUnitAccountEl.classList.remove('hidden');
      }
      
      // Hide the Unit send form if visible
      const unitSendSection = document.getElementById('unitSendSection');
      if (unitSendSection && !unitSendSection.classList.contains('hidden')) {
        unitSendSection.classList.add('hidden');
      }
    } else {
      // User has a Unit account
      if (noUnitAccountEl) {
        noUnitAccountEl.classList.add('hidden');
      }
    }
  } catch (error) {
    console.error('Error checking Unit account:', error);
  }
}

// Fetch and display user balance
async function fetchUserBalance() {
  try {
    const token = localStorage.getItem('token');
    const balanceElement = document.getElementById('user-balance');
    
    if (!balanceElement) return;
    
    // Make API calls to test functionality, but ignore the results
    try {
      const unitResponse = await fetch(`${API_BASE}/api/unit/accounts/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (unitResponse.ok) {
        const unitData = await unitResponse.json();
        console.log('Unit balance data:', unitData);
        // Process data for debugging but don't use for display
      }
    } catch (unitError) {
      console.log('Unit balance not available:', unitError);
    }
    
    try {
      const profileRes = await fetch(`${API_BASE}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (profileRes.ok) {
        const profile = await profileRes.json();
        console.log('Profile data:', profile);
        // Process data for debugging but don't use for display
      }
    } catch (profileError) {
      console.log('Profile fetch failed:', profileError);
    }
    
    // Always display $500.00 for testing
    balanceElement.textContent = '$500.00';
  } catch (error) {
    console.error('Error fetching balance:', error);
    if (balanceElement) {
      balanceElement.textContent = '$500.00';
    }
  }
}

// Add KYC warning banner
function addKycWarningBanner() {
  // Create warning banner
  const banner = document.createElement('div');
  banner.className = 'kyc-warning-banner';
  banner.innerHTML = `
    <p>Your identity verification is required before you can send or request money.</p>
    <button id="verify-identity-btn" class="primary-btn">Verify Identity</button>
  `;
  
  // Insert at the top of the main content
  const mainContent = document.querySelector('.money-mover') || document.querySelector('.moneymover-container') || document.querySelector('main');
  if (mainContent) {
    mainContent.insertBefore(banner, mainContent.firstChild);
    
    // Add event listener to the button
    document.getElementById('verify-identity-btn').addEventListener('click', function() {
      redirectToKyc('transaction');
    });
  }
}

// Disable transaction buttons if KYC not approved
function disableTransactionButtons() {
  // Regular send form
  const sendForm = document.getElementById('sendForm');
  if (sendForm) {
    const sendButton = sendForm.querySelector('button[type="submit"]');
    if (sendButton) {
      sendButton.disabled = true;
      sendButton.title = 'Identity verification required';
      sendButton.addEventListener('click', function(e) {
        e.preventDefault();
        redirectToKyc('send');
      });
    }
  }
  
  // Request form
  const requestForm = document.getElementById('requestForm');
  if (requestForm) {
    const requestButton = requestForm.querySelector('button[type="submit"]');
    if (requestButton) {
      requestButton.disabled = true;
      requestButton.title = 'Identity verification required';
      requestButton.addEventListener('click', function(e) {
        e.preventDefault();
        redirectToKyc('request');
      });
    }
  }
  
  // Unit send form
  const unitSendForm = document.getElementById('unitSendForm');
  if (unitSendForm) {
    const unitSendButton = unitSendForm.querySelector('button[type="submit"]');
    if (unitSendButton) {
      unitSendButton.disabled = true;
      unitSendButton.title = 'Identity verification required';
      unitSendButton.addEventListener('click', function(e) {
        e.preventDefault();
        redirectToKyc('unit');
      });
    }
  }
}

// Redirect to KYC page
function redirectToKyc(action) {
  // Store the intended action to return to after KYC
  localStorage.setItem('pendingAction', action);
  
  // Show a friendly message
  alert('To keep your account secure, we need to verify your identity before you can send or receive money. Let\'s complete this quick process now!');
  
  // Redirect to KYC page
  window.location.href = 'identity-verification.html';
}

// Handle regular send money
async function handleSendMoney(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitButton = form.querySelector('button[type="submit"]');
  
  try {
    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    
    const formData = new FormData(form);
    const sendData = {
      recipientName: formData.get('recipientName'),
      recipientCountry: formData.get('recipientCountry'),
      amountUsd: parseFloat(formData.get('amountUsd'))
    };
    
    // Send API request
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/transactions/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(sendData)
    });
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.textContent = 'Send';
    
    const result = await res.json();
    
    if (res.ok) {
      alert('Money sent successfully!');
      form.reset();
      fetchUserBalance(); // Update balance display
    } else {
      alert(result.message || 'Failed to send money. Please try again.');
    }
  } catch (error) {
    console.error('Send money error:', error);
    alert('An error occurred. Please try again.');
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.textContent = 'Send';
  }
}

// Handle request money
async function handleRequestMoney(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitButton = form.querySelector('button[type="submit"]');
  
  try {
    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Requesting...';
    
    const formData = new FormData(form);
    const requestData = {
      requestedFrom: formData.get('requestedFrom'),
      requestNote: formData.get('requestNote'),
      amountUsd: parseFloat(formData.get('amountUsd'))
    };
    
    // Send API request
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/requests/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.textContent = 'Request';
    
    const result = await res.json();
    
    if (res.ok) {
      alert('Money request sent successfully!');
      form.reset();
    } else {
      alert(result.message || 'Failed to request money. Please try again.');
    }
  } catch (error) {
    console.error('Request money error:', error);
    alert('An error occurred. Please try again.');
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.textContent = 'Request';
  }
}

// Handle Unit send money
async function handleUnitSendMoney(e) {
  e.preventDefault();
  
  const receiver = document.getElementById('unit-receiver-input').value.trim();
  const amount = parseFloat(document.getElementById('unit-amount-input').value);
  const note = document.getElementById('unit-note-input').value.trim();
  const errorMsg = document.getElementById('unit-error-message');
  const submitButton = document.getElementById('unit-send-button');
  
  // Validation
  if (!receiver) {
    showError(errorMsg, 'Please enter a recipient');
    return;
  }
  
  if (isNaN(amount) || amount <= 0) {
    showError(errorMsg, 'Please enter a valid amount');
    return;
  }
  
  try {
    // Clear error and show loading
    hideError(errorMsg);
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    
    // Convert to cents for API
    const amountInCents = Math.round(amount * 100);
    
    // Send API request
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/unit/payments/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        receiver,
        amount: amountInCents,
        description: note
      })
    });
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.textContent = 'Send via Unit';
    
    if (res.ok) {
      const result = await res.json();
      alert('Money sent successfully via Unit!');
      document.getElementById('unitSendForm').reset();
      fetchUserBalance(); // Update balance display
    } else {
      const error = await res.json();
      showError(errorMsg, error.message || 'Failed to send money. Please try again.');
    }
  } catch (error) {
    console.error('Unit send error:', error);
    showError(errorMsg, 'An error occurred. Please try again.');
    
    // Reset button state
    submitButton.disabled = false;
    submitButton.textContent = 'Send via Unit';
  }
}

// Set up Unit account
async function setupUnitAccount() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/unit/accounts/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      alert('Banking account created successfully!');
      
      // Refresh the page to show the new account
      window.location.reload();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to create banking account');
    }
  } catch (error) {
    console.error('Error setting up Unit account:', error);
    alert('An error occurred while setting up your banking account');
  }
}

// Show error message
function showError(element, message) {
  element.textContent = message;
  element.classList.remove('hidden');
}

// Hide error message
function hideError(element) {
  element.classList.add('hidden');
}
