const API_BASE = '';

// ========== Hide All Panels ==========
function hideAllPanels() {
  document.querySelectorAll('.action-panel, .plaid-panel').forEach(panel => panel.classList.add('hidden'));
}

// ========== Format Currency ==========
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// ========== Show Messages ==========
function showPlaidError(message) {
  const el = document.getElementById('plaid-error-message');
  if (el) {
    el.textContent = message;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
  }
}

function showPlaidSuccess(message) {
  const el = document.getElementById('plaid-success-message');
  if (el) {
    el.textContent = message;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
  }
}

// ========== Debounce ==========
function debounce(func, delay = 500) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// ========== Plaid Integration ==========
function loadPlaidIntegration() {
  if (!document.getElementById('plaid-link-script')) {
    const script = document.createElement('script');
    script.id = 'plaid-link-script';
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.async = true;
    document.head.appendChild(script);
  }
  initPlaid();
}

function initPlaid() {
  const connectBtn = document.getElementById('connect-bank-btn');
  const viewTxBtn = document.getElementById('view-transactions-btn');
  const panel = document.getElementById('plaid-transactions-panel');
  const accFilter = document.getElementById('account-filter');
  const dateFilter = document.getElementById('date-filter');
  const loadMoreBtn = document.getElementById('load-more-transactions');

  if (!connectBtn) return;

  connectBtn.addEventListener('click', openPlaidLink);
  viewTxBtn?.addEventListener('click', togglePlaidTransactionsPanel);
  panel?.querySelector('.close-panel')?.addEventListener('click', () => panel.classList.add('hidden'));

  accFilter?.addEventListener('change', debounce(() => loadPlaidTransactions()));
  dateFilter?.addEventListener('change', debounce(() => loadPlaidTransactions()));
  loadMoreBtn?.addEventListener('click', () => loadPlaidTransactions(true));

  loadPlaidAccounts();
}

async function openPlaidLink() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/plaid/create-link-token`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { link_token } = await res.json();

    if (typeof Plaid === 'undefined') {
      showPlaidError('Plaid failed to load.');
      return;
    }

    const handler = Plaid.create({
      token: link_token,
      onSuccess: (publicToken, metadata) => exchangePublicToken(publicToken, metadata),
      onExit: (err, metadata) => console.log('User exited Plaid Link', err, metadata),
      onEvent: (eventName, metadata) => console.log('Plaid Link event', eventName, metadata)
    });

    handler.open();
  } catch (err) {
    console.error('Open Plaid Link Error:', err);
    showPlaidError('Error connecting bank.');
  }
}

async function exchangePublicToken(publicToken, metadata) {
  try {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/api/plaid/exchange-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        public_token: publicToken,
        institution_name: metadata.institution.name
      })
    });
    showPlaidSuccess('Bank account connected!');
    loadPlaidAccounts();
  } catch (err) {
    console.error('Exchange Token Error:', err);
    showPlaidError('Bank connection failed.');
  }
}

async function loadPlaidAccounts() {
  try {
    const token = localStorage.getItem('token');
    const list = document.getElementById('plaid-accounts-list');
    const noMsg = document.getElementById('no-plaid-accounts');
    const container = document.getElementById('plaid-accounts-container');
    const viewTxBtn = document.getElementById('view-transactions-btn');

    if (!list || !noMsg || !container) return;
    list.innerHTML = '<li class="loading">Loading accounts...</li>';

    const res = await fetch(`${API_BASE}/api/plaid/accounts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { accounts = [] } = await res.json();

    if (accounts.length === 0) {
      container.classList.add('hidden');
      noMsg.classList.remove('hidden');
      viewTxBtn && (viewTxBtn.style.display = 'none');
      return;
    }

    container.classList.remove('hidden');
    noMsg.classList.add('hidden');
    viewTxBtn && (viewTxBtn.style.display = 'flex');
    list.innerHTML = '';
    updateAccountFilter(accounts);

    accounts.forEach(account => {
      const li = document.createElement('li');
      li.className = 'plaid-account-item';
      li.dataset.accountId = account.id;

      const icon = account.type === 'credit' ? 'credit_card' :
                   account.subtype === 'savings' ? 'savings' :
                   'account_balance';

      li.innerHTML = `
        <div class="account-info">
          <span class="material-icons account-icon">${icon}</span>
          <div class="account-details">
            <span class="account-name">${account.name}</span>
            <div class="account-meta">
              <span class="account-institution">${account.institution}</span>
              <span class="account-number">•••• ${account.mask || '****'}</span>
            </div>
          </div>
        </div>
        <span class="account-balance">
          <button class="refresh-balance-btn" data-account-id="${account.id}">
            <span class="material-icons">refresh</span>
          </button>
          <span class="balance-amount" id="balance-${account.id}">$-.--</span>
        </span>
      `;
      list.appendChild(li);
      fetchPlaidAccountBalance(account.id);
    });

    list.querySelectorAll('.refresh-balance-btn').forEach(btn =>
      btn.addEventListener('click', e => {
        e.preventDefault();
        fetchPlaidAccountBalance(btn.dataset.accountId, true);
      })
    );

    updatePlaidTotalBalance();
  } catch (err) {
    console.error('Load Accounts Error:', err);
    const list = document.getElementById('plaid-accounts-list');
    list && (list.innerHTML = '<li class="error">Failed to load accounts</li>');
  }
}

async function fetchPlaidAccountBalance(accountId, showLoading = false) {
  try {
    const token = localStorage.getItem('token');
    const el = document.getElementById(`balance-${accountId}`);
    if (!el) return;
    if (showLoading) el.innerHTML = '<span class="loading-spinner"></span>';

    const res = await fetch(`${API_BASE}/api/plaid/balance/${accountId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const balance = data.balance?.available ?? data.balance?.current ?? 0;
    el.textContent = formatCurrency(balance);
  } catch (err) {
    console.error('Fetch Balance Error:', err);
    const el = document.getElementById(`balance-${accountId}`);
    el && (el.textContent = 'Error');
  }
}

async function updatePlaidTotalBalance() {
  try {
    const token = localStorage.getItem('token');
    const el = document.getElementById('plaid-total-balance');
    if (!el) return;

    const res = await fetch(`${API_BASE}/api/plaid/accounts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { accounts = [] } = await res.json();

    const balances = await Promise.all(
      accounts.map(acc =>
        fetch(`${API_BASE}/api/plaid/balance/${acc.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(r => r.json())
          .then(d => d.balance?.available ?? d.balance?.current ?? 0)
          .catch(() => 0)
      )
    );

    const total = balances.reduce((sum, b) => sum + b, 0);
    el.textContent = formatCurrency(total);
  } catch (err) {
    console.error('Update Total Balance Error:', err);
  }
}

function updateAccountFilter(accounts) {
  const filter = document.getElementById('account-filter');
  if (!filter) return;
  const current = filter.value;
  while (filter.options.length > 1) filter.remove(1);
  accounts.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = `${a.name} (${a.institution})`;
    filter.appendChild(opt);
  });
  if ([...filter.options].some(o => o.value === current)) {
    filter.value = current;
  }
}

function togglePlaidTransactionsPanel() {
  const panel = document.getElementById('plaid-transactions-panel');
  if (!panel) return;
  const isVisible = !panel.classList.contains('hidden');
  hideAllPanels();
  if (!isVisible) {
    panel.classList.remove('hidden');
    loadPlaidTransactions();
  }
}

async function loadPlaidTransactions(append = false) {
  // You can paste your existing `loadPlaidTransactions()` logic here
  // or keep it modularized if already implemented elsewhere.
}

// ========== DOM Ready Initialization ==========
document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('link[href*="material-icons"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    document.head.appendChild(link);
  }

  //loadDashboard?.();
  //initBanking?.();
  loadPlaidIntegration();

  if (window.location.hash === '#banking') {
    const bankingSection = document.getElementById('banking');
    bankingSection && setTimeout(() => {
      bankingSection.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  }
});

// ========== Edit Profile Modal ==========
function initProfileManagement() {
  // Edit Profile button functionality
  const editProfileBtn = document.getElementById('openEditProfileModal');
  const editProfileModal = document.getElementById('editProfileModal');
  const closeModalBtn = document.querySelector('.close-profile-modal');
  
  if (editProfileBtn && editProfileModal) {
    console.log('Edit profile elements found');
    
    // Open the modal when the button is clicked
    editProfileBtn.addEventListener('click', () => {
      // Force the modal to proper position and display
      editProfileModal.style.position = 'fixed';
      editProfileModal.style.top = '0';
      editProfileModal.style.left = '0';
      editProfileModal.style.width = '100%';
      editProfileModal.style.height = '100%';
      editProfileModal.style.display = 'flex';
      editProfileModal.style.alignItems = 'center';
      editProfileModal.style.justifyContent = 'center';
      editProfileModal.style.zIndex = '1000';
      
      // Remove hidden class
      editProfileModal.classList.remove('hidden');
      
      // Load user profile data
      loadUserProfile();
    });
    
    // Helper function to close modal
    const closeModal = () => {
      editProfileModal.classList.add('hidden');
      editProfileModal.style.display = 'none';
    };
    
    // Replace the existing close button code with this
    if (closeModalBtn) {
      console.log('Close button found:', closeModalBtn);
      closeModalBtn.addEventListener('click', () => {
        console.log('Close button clicked');
        closeModal();
      });
    }
    
    // Add direct click handler to close button as a fallback
    const closeBtn = document.querySelector('.close-profile-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        console.log('Close button clicked (direct)');
        editProfileModal.classList.add('hidden');
        editProfileModal.style.display = 'none';
      });
    }
    
    // Handle form submission
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
      editProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        console.log('Profile form submitted');
        
        // Show loading state
        const submitBtn = editProfileForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;
        
        try {
          // Get form values
          const name = document.getElementById('edit-name').value;
          const username = document.getElementById('edit-username').value;
          const email = document.getElementById('edit-email').value;
          const phone = document.getElementById('edit-phone').value;
          const address = document.getElementById('edit-address').value;
          
          // Basic field validation
          if (name.trim() === '') {
            alert('Name is required');
            document.getElementById('edit-name').focus();
            return;
          }

          if (username.trim() === '') {
            alert('Username is required');
            document.getElementById('edit-username').focus();
            return;
          }

          if (email.trim() === '') {
            alert('Email is required');
            document.getElementById('edit-email').focus();
            return;
          }

          if (phone.trim() === '') {
            alert('Phone number is required');
            document.getElementById('edit-phone').focus();
            return;
          }

          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email.trim())) {
            alert('Please enter a valid email address');
            document.getElementById('edit-email').focus();
            return;
          }

          // Basic phone validation - allows various formats
          const phoneRegex = /^\+?[0-9()-\s]{10,15}$/;
          if (!phoneRegex.test(phone.trim())) {
            alert('Please enter a valid phone number');
            document.getElementById('edit-phone').focus();
            return;
          }
          
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_BASE}/api/user/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, username, email, phone, address })
          });
          
          if (response.ok) {
            const result = await response.json();
            alert('Profile updated successfully!');
            // Update UI with new data
            updateProfileDisplay(result);
            // Close the modal properly
            editProfileModal.classList.add('hidden');
            editProfileModal.style.display = 'none';
            
            // Refresh dashboard data
            loadDashboardProfile();
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update profile');
          }
        } catch (error) {
          console.error('Error saving profile:', error);
          alert(`Failed to update profile: ${error.message || 'Please try again'}`);
        } finally {
          // Restore button state
          submitBtn.textContent = originalBtnText;
          submitBtn.disabled = false;
        }
      });
    }
  } else {
    console.error('Edit profile button or modal not found', { 
      buttonFound: !!editProfileBtn, 
      modalFound: !!editProfileModal 
    });
  }
}

// Function to load user data into the form
async function loadUserProfile() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to edit your profile');
      window.location.href = 'login.html';
      return;
    }
    
    // Show loading indicator
    const fields = ['edit-name', 'edit-username', 'edit-email', 'edit-phone', 'edit-address'];
    fields.forEach(id => {
      const field = document.getElementById(id);
      if (field) field.placeholder = 'Loading...';
    });
    
    const response = await fetch(`${API_BASE}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load profile');
    }
    
    const userData = await response.json();
    
    // Populate form fields with user data
    document.getElementById('edit-name').value = userData.name || '';
    document.getElementById('edit-username').value = userData.username || '';
    document.getElementById('edit-email').value = userData.email || '';
    document.getElementById('edit-phone').value = userData.phone || '';
    document.getElementById('edit-address').value = userData.address || '';
    
    // Restore placeholders
    document.getElementById('edit-name').placeholder = 'Full Name';
    document.getElementById('edit-username').placeholder = 'Username';
    document.getElementById('edit-email').placeholder = 'Email';
    document.getElementById('edit-phone').placeholder = 'Phone Number';
    document.getElementById('edit-address').placeholder = 'Address';
    
  } catch (error) {
    console.error('Error loading profile:', error);
    alert('Failed to load profile information. Please try again.');
  }
}

function updateProfileDisplay(userData) {
  // Update any profile information displayed on the page
  document.getElementById('user-fullname').textContent = userData.name || 'User';
  document.getElementById('user-name').textContent = userData.name || '';
  document.getElementById('user-email').textContent = userData.email || '';
  document.getElementById('user-phone').textContent = userData.phone || '';
  document.getElementById('user-address').textContent = userData.address || '';
  document.getElementById('user-kyc').textContent = userData.kyc_status || 'pending';
  document.getElementById('user-balance').textContent = formatCurrency(userData.balance || 0);
  
  // Update KYC banner if needed
  const kycBanner = document.getElementById('kyc-banner');
  if (kycBanner) {
    if (userData.kyc_status === 'verified' || userData.kyc_status === 'completed') {
      kycBanner.style.display = 'none';
    } else {
      kycBanner.style.display = 'block';
    }
  }
  
  console.log('Profile display updated with:', userData);
}

// ========== Load Dashboard Profile ==========
async function loadDashboardProfile() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = "/login.html";
      return;
    }
    
    const response = await fetch(`${API_BASE}/api/user/profile`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    
    const data = await response.json();
    console.log('User data loaded:', data);
    
    // Update dashboard elements with user data
    document.getElementById("user-fullname").textContent = data.name || 'User';
    document.getElementById("user-name").textContent = data.username || 'Username';
    document.getElementById("user-email").textContent = data.email || 'Email';
    document.getElementById("user-phone").textContent = data.phone || '+1...';
    document.getElementById("user-address").textContent = data.address || 'Address';
    document.getElementById("user-balance").textContent = formatCurrency(data.balance || 0);
    document.getElementById("user-kyc").textContent = data.kyc_status || 'pending';
    
    // Update KYC banner visibility
    const kycBanner = document.getElementById("kyc-banner");
    if (kycBanner) {
      console.log('kyc status from API:', data.kyc_status);
      // Show or hide the KYC banner based on status
      if (data.kyc_status === "verified" || 
        data.kyc_status === "completed" ||
        data.kyc_status === "approved" ||
        data.kyc_status === "pending_review") {
          console.log('Hiding KYC banner is:', data.kyc_status);
        kycBanner.style.display = "none";
      } else {
        console.log('Showing KYC banner is:', data.kyc_status);
        kycBanner.style.display = "block";
      }
    }
  }
  catch (error) {
    console.error("Error fetching profile:", error);
  }
}

// ========== Reset Modal State ==========
function resetModalState() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  });
}

function initKYCVerification() {
  const kycBtn = document.getElementById('start-kyc-btn');
  if (kycBtn) {
    console.log('KYC button found, adding event listener');
    kycBtn.addEventListener('click', async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to start KYC verification');
        window.location.href = 'login.html';
        return;
      }
      console.log('Redirecting to identity verification page');
      window.location.href = 'identity-verification.html';
    });
  } else {
    console.error('KYC button not found in the DOM');
  }
}
// ========== DOM Ready Initialization ==========
document.addEventListener('DOMContentLoaded', () => {
  // Reset modals first
  resetModalState();
  
  // Then do other initialization
  if (!document.querySelector('link[href*="material-icons"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    document.head.appendChild(link);
  }

  // Generate QR code for profile
  generateProfileQR();
  
  // Load user profile data
  loadDashboardProfile();
  
  // Initialize profile management
  initProfileManagement();

  // Initialize KYC verification
  initKYCVerification();
  
  if (window.location.hash === '#banking') {
    const bankingSection = document.getElementById('banking');
    bankingSection && setTimeout(() => {
      bankingSection.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  }
});

// QR Code Scanner
function generateProfileQR() {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  fetch(`${API_BASE}/api/user/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(response => response.json())
  .then(userData => {
    // Create QR code that encodes a URL to find this user
    const qrContainer = document.getElementById('qrcode-container');
    if (!qrContainer) return;
    
    // Clear previous QR code
    qrContainer.innerHTML = '';
    
    // The data to encode in the QR code - typically a URL with user ID
    const qrData = `https://www.pagomigo.com/find-user?id=${userData._id}`;
    
    // Generate QR code
    new QRCode(qrContainer, {
      text: qrData,
      width: 200,
      height: 200,
      colorDark: "#0055FF", // Use your app's primary color
      colorLight: "#FFFFFF",
      correctLevel: QRCode.CorrectLevel.H
    });
    
    // Enable download button
    const downloadBtn = document.getElementById('download-qrcode');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        // Convert QR code to an image and download
        const canvas = qrContainer.querySelector('canvas');
        if (canvas) {
          const image = canvas.toDataURL("image/png");
          const link = document.createElement('a');
          link.href = image;
          link.download = `pagomigo-${userData.username || 'profile'}.png`;
          link.click();
        }
      });
    }
  })
  .catch(error => console.error('Error generating QR code:', error));
}