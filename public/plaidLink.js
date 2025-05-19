// plaidLink.js - Client-side integration with Plaid Link

/**
 * PlaidLink - Client-side utilities for Plaid Link integration
 * For use in the Pagomigo application
 */
class PlaidLink {
  constructor() {
    this.apiBaseUrl = '/api/plaid';
    this.token = localStorage.getItem('token');
    this.initialized = false;
    this.linkHandler = null;

    // DOM elements we'll need
    this.elements = {
      connectBankBtn: document.getElementById('connect-bank-btn'),
      verifyIdentityBtn: document.getElementById('verify-identity-btn'), // Added verification button
      accountsList: document.getElementById('accounts-list'),
      accountsContainer: document.getElementById('accounts-container'),
      noAccountsMessage: document.getElementById('no-accounts-message'),
      errorMessage: document.getElementById('error-message'),
      successMessage: document.getElementById('success-message'),
      // Verification status elements
      verificationStatusCircle: document.getElementById('verification-status-circle'),
      verificationStatusText: document.getElementById('verification-status-text'),
      verificationMessage: document.getElementById('verification-message')
    };
  }

  /**
   * Initialize the Plaid Link integration
   */
  async init() {
    try {
      // Make sure the Plaid Link script is loaded
      if (!window.Plaid) {
        await this.loadPlaidScript();
      }

      // Set up event listeners
      this.setupEventListeners();

      // Load connected accounts
      await this.loadConnectedAccounts();
      
      // Check verification status if on dashboard or account page
      await this.checkVerificationStatus();

      this.initialized = true;
      console.log('Plaid Link initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Plaid Link:', error);
      this.showError('Could not initialize Plaid Link. Please try again later.');
    }
  }

  /**
   * Load the Plaid Link script
   */
  loadPlaidScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Plaid Link script'));
      document.head.appendChild(script);
    });
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Connect bank button
    if (this.elements.connectBankBtn) {
      this.elements.connectBankBtn.addEventListener('click', () => {
        this.openPlaidLink();
      });
    }
    
    // Verify identity button
    if (this.elements.verifyIdentityBtn) {
      this.elements.verifyIdentityBtn.addEventListener('click', () => {
        this.openIdentityVerification();
      });
    }
  }

  /**
   * Helper method for authenticated fetch requests
   */
  async fetchWithAuth(url, options = {}) {
    // Make sure token is current
    this.token = localStorage.getItem('token');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...options.headers
    };

    return fetch(url, {
      ...options,
      headers
    });
  }

  /**
   * Open Plaid Link to connect a bank account
   */
  async openPlaidLink() {
    try {
      // First, get a link token from our server
      const response = await this.fetchWithAuth(`${this.apiBaseUrl}/create-link-token`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to get link token');
      }

      const data = await response.json();
      const linkToken = data.link_token;

      // Configure Plaid Link
      const handler = Plaid.create({
        token: linkToken,
        onSuccess: (publicToken, metadata) => {
          this.handleLinkSuccess(publicToken, metadata);
        },
        onExit: (err, metadata) => {
          if (err) {
            console.error('Plaid Link error:', err);
          }
        },
        onEvent: (eventName, metadata) => {
          console.log('Plaid Link event:', eventName, metadata);
        }
      });

      // Open Link
      handler.open();

    } catch (error) {
      console.error('Error opening Plaid Link:', error);
      this.showError('Failed to connect to your bank. Please try again.');
    }
  }

  /**
   * Open Plaid Link for Identity Verification
   */
  async openIdentityVerification() {
    try {
      // Show loading state on button if it exists
      if (this.elements.verifyIdentityBtn) {
        this.elements.verifyIdentityBtn.classList.add('loading');
        this.elements.verifyIdentityBtn.disabled = true;
      }
      
      // First, get a link token from our server
      const response = await this.fetchWithAuth(`${this.apiBaseUrl}/create-idv-link-token`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to get IDV link token');
      }

      const data = await response.json();
      const linkToken = data.link_token;

      // Configure Plaid Link for IDV
      const handler = Plaid.create({
        token: linkToken,
        onSuccess: (publicToken, metadata) => {
          // The identity_verification_id will be in the metadata
          this.handleIdvSuccess(publicToken, metadata);
        },
        onExit: (err, metadata) => {
          // Reset button state
          if (this.elements.verifyIdentityBtn) {
            this.elements.verifyIdentityBtn.classList.remove('loading');
            this.elements.verifyIdentityBtn.disabled = false;
          }
          
          if (err) {
            console.error('Plaid IDV error:', err);
            this.showError('Verification process was interrupted. Please try again.');
          }
        },
        onEvent: (eventName, metadata) => {
          console.log('Plaid IDV event:', eventName, metadata);
        }
      });

      // Open Link
      handler.open();

    } catch (error) {
      console.error('Error opening Plaid IDV:', error);
      this.showError('Failed to start identity verification. Please try again.');
      
      // Reset button state
      if (this.elements.verifyIdentityBtn) {
        this.elements.verifyIdentityBtn.classList.remove('loading');
        this.elements.verifyIdentityBtn.disabled = false;
      }
    }
  }

  /**
   * Handle successful IDV flow
   */
  async handleIdvSuccess(publicToken, metadata) {
    try {
      console.log('IDV Success metadata:', metadata);
      
      // Extract the identity verification ID from metadata
      const identityVerificationId = metadata.identity_verification?.id;

      if (!identityVerificationId) {
        throw new Error('Identity verification ID not found in response');
      }

      // Send to server to complete the verification
      const response = await this.fetchWithAuth(`${this.apiBaseUrl}/complete-idv`, {
        method: 'POST',
        body: JSON.stringify({
          identity_verification_id: identityVerificationId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete identity verification');
      }

      const data = await response.json();
      console.log('Complete IDV response:', data);

      // Show appropriate message based on status
      if (data.status === 'success') {
        this.showSuccess('Identity verification completed successfully!');
      } else if (data.status === 'pending_review') {
        this.showSuccess('Identity verification submitted for review. We\'ll notify you when it\'s complete.');
      } else {
        this.showSuccess(`Verification initiated with status: ${data.status}. We'll update you when the process completes.`);
      }

      // Update verification status display
      await this.checkVerificationStatus();

      // Reset button state
      if (this.elements.verifyIdentityBtn) {
        this.elements.verifyIdentityBtn.classList.remove('loading');
        this.elements.verifyIdentityBtn.disabled = false;
      }

    } catch (error) {
      console.error('Error handling IDV success:', error);
      this.showError('Failed to complete identity verification. Please try again.');
      
      // Reset button state
      if (this.elements.verifyIdentityBtn) {
        this.elements.verifyIdentityBtn.classList.remove('loading');
        this.elements.verifyIdentityBtn.disabled = false;
      }
    }
  }
  
  /**
   * Check and update verification status
   */
  async checkVerificationStatus() {
    // If verification status elements don't exist, skip
    if (!this.elements.verificationStatusCircle || 
        !this.elements.verificationStatusText || 
        !this.elements.verificationMessage) {
      return;
    }
    
    try {
      // First try Plaid verification status
      const plaidResponse = await this.fetchWithAuth(`${this.apiBaseUrl}/verification-status`);
      
      // If Plaid not set up, fall back to Persona
      let data;
      if (!plaidResponse.ok) {
        const personaResponse = await this.fetchWithAuth('/api/persona/verification-status');
        
        if (!personaResponse.ok) {
          throw new Error('Failed to get verification status');
        }
        
        data = await personaResponse.json();
      } else {
        data = await plaidResponse.json();
      }
      
      // Update the UI based on status
      this.elements.verificationStatusCircle.className = 
        `status-circle ${data.status === 'approved' || data.status === 'success' ? 
                        'approved' : 
                        data.status === 'failed' ? 
                        'failed' : 
                        'pending'}`;
      
      if (data.status === 'approved' || data.status === 'success') {
        this.elements.verificationStatusText.textContent = 'Verified';
        this.elements.verificationMessage.textContent = 'Your identity has been successfully verified.';
        if (this.elements.verifyIdentityBtn) {
          this.elements.verifyIdentityBtn.style.display = 'none'; // Hide the button if already verified
        }
      } else if (data.status === 'failed') {
        this.elements.verificationStatusText.textContent = 'Verification Failed';
        this.elements.verificationMessage.textContent = 'There was an issue with your verification. Please try again.';
      } else if (data.status === 'pending_review') {
        this.elements.verificationStatusText.textContent = 'Under Review';
        this.elements.verificationMessage.textContent = 'Your verification is being reviewed. We\'ll notify you when it\'s complete.';
        if (this.elements.verifyIdentityBtn) {
          this.elements.verifyIdentityBtn.style.display = 'none'; // Hide the button if under review
        }
      } else {
        this.elements.verificationStatusText.textContent = 'Verification Pending';
        this.elements.verificationMessage.textContent = 'Complete identity verification to unlock all features of your account.';
      }
      
    } catch (error) {
      console.error('Error checking verification status:', error);
      this.elements.verificationStatusText.textContent = 'Verification Needed';
      this.elements.verificationMessage.textContent = 'Please complete identity verification to unlock all features.';
    }
  }

  /**
   * Handle successful Plaid Link flow
   */
  async handleLinkSuccess(publicToken, metadata) {
    try {
      const institution = metadata.institution;
      const accounts = metadata.accounts;

      // Exchange public token for access token
      const response = await this.fetchWithAuth(`${this.apiBaseUrl}/exchange-token`, {
        method: 'POST',
        body: JSON.stringify({
          public_token: publicToken,
          institution_name: institution.name
        })
      });

      if (!response.ok) {
        throw new Error('Failed to connect bank account');
      }

      // Show success message
      this.showSuccess('Bank account connected successfully!');

      // Reload connected accounts
      await this.loadConnectedAccounts();

    } catch (error) {
      console.error('Error handling Link success:', error);
      this.showError('Failed to connect your bank account. Please try again.');
    }
  }

  /**
   * Load and display connected accounts
   */
  async loadConnectedAccounts() {
    if (!this.elements.accountsList) return;

    try {
      const response = await this.fetchWithAuth(`${this.apiBaseUrl}/accounts`);

      if (!response.ok) {
        throw new Error('Failed to fetch connected accounts');
      }

      const data = await response.json();
      const accounts = data.accounts || [];

      // Update UI based on whether there are accounts
      if (accounts.length === 0) {
        if (this.elements.noAccountsMessage) {
          this.elements.noAccountsMessage.classList.remove('hidden');
        }
        if (this.elements.accountsContainer) {
          this.elements.accountsContainer.classList.add('hidden');
        }
        return;
      }

      // Show accounts container, hide no accounts message
      if (this.elements.noAccountsMessage) {
        this.elements.noAccountsMessage.classList.add('hidden');
      }
      if (this.elements.accountsContainer) {
        this.elements.accountsContainer.classList.remove('hidden');
      }

      // Clear existing accounts
      this.elements.accountsList.innerHTML = '';

      // Create account list items
      accounts.forEach(account => {
        const li = document.createElement('li');
        li.className = 'bank-account-item';
        li.dataset.accountId = account.id;
        li.dataset.itemId = account.item_id;

        // Determine account icon based on type
        let accountIcon = 'account-icon.svg';
        if (account.type === 'depository') {
          accountIcon = 'checking-icon.svg';
        } else if (account.type === 'credit') {
          accountIcon = 'credit-icon.svg';
        }

        li.innerHTML = `
          <div class="account-info">
            <img src="${accountIcon}" alt="${account.type}" class="account-type-icon">
            <div class="account-details">
              <span class="account-name">${account.name}</span>
              <span class="account-institution">${account.institution}</span>
              <span class="account-masked-number">•••• ${account.mask}</span>
            </div>
          </div>
          <div class="account-actions">
            <button class="view-transactions-btn" data-account-id="${account.id}">
              Transactions
            </button>
            <button class="check-balance-btn" data-account-id="${account.id}">
              Balance
            </button>
          </div>
        `;

        this.elements.accountsList.appendChild(li);
      });

      // Add event listeners to the action buttons
      this.elements.accountsList.querySelectorAll('.view-transactions-btn').forEach(btn => {
        btn.addEventListener('click', event => {
          const accountId = event.target.dataset.accountId;
          this.viewTransactions(accountId);
        });
      });

      this.elements.accountsList.querySelectorAll('.check-balance-btn').forEach(btn => {
        btn.addEventListener('click', event => {
          const accountId = event.target.dataset.accountId;
          this.checkBalance(accountId);
        });
      });

    } catch (error) {
      console.error('Error loading connected accounts:', error);
      if (this.elements.accountsList) {
        this.elements.accountsList.innerHTML = '<li class="error-message">Error loading accounts</li>';
      }
    }
  }

  /**
   * View transactions for an account
   */
  async viewTransactions(accountId) {
    // Implementation for viewing transactions
    // This could open a modal, navigate to a transactions page, etc.
    console.log('View transactions for account:', accountId);
  }

  /**
   * Check balance for an account
   */
  async checkBalance(accountId) {
    try {
      const response = await this.fetchWithAuth(`${this.apiBaseUrl}/balance/${accountId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();
      const balance = data.balance;

      // Format the balances
      const currentBalance = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(balance.current);

      const availableBalance = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(balance.available || balance.current);

      // Show balance in a modal or alert
      alert(`Current balance: ${currentBalance}\nAvailable balance: ${availableBalance}`);

    } catch (error) {
      console.error('Error checking balance:', error);
      this.showError('Failed to retrieve balance. Please try again.');
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (!this.elements.errorMessage) return;

    this.elements.errorMessage.textContent = message;
    this.elements.errorMessage.classList.remove('hidden');

    // Auto hide after 5 seconds
    setTimeout(() => {
      this.hideError();
    }, 5000);
  }

  /**
   * Hide error message
   */
  hideError() {
    if (!this.elements.errorMessage) return;

    this.elements.errorMessage.classList.add('hidden');
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    if (!this.elements.successMessage) return;

    this.elements.successMessage.textContent = message;
    this.elements.successMessage.classList.remove('hidden');

    // Auto hide after 5 seconds
    setTimeout(() => {
      this.hideSuccess();
    }, 5000);
  }

  /**
   * Hide success message
   */
  hideSuccess() {
    if (!this.elements.successMessage) return;

    this.elements.successMessage.classList.add('hidden');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const plaidLink = new PlaidLink();
  plaidLink.init();

  // Make available globally for debugging
  window.plaidLink = plaidLink;
});