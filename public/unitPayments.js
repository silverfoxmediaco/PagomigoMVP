// public/js/unitPayments.js

/**
 * UnitPayments - Client-side utilities for Unit.co payment functionality
 * For use in the Pagomigo application
 */
class UnitPayments {
    constructor() {
      this.apiBaseUrl = '/api/unit';
      this.token = localStorage.getItem('token');
      this.initialized = false;
      
      // DOM elements we'll need
      this.elements = {
        balanceDisplay: document.getElementById('account-balance'),
        sendForm: document.getElementById('send-money-form'),
        receiverField: document.getElementById('receiver-input'),
        amountField: document.getElementById('amount-input'),
        noteField: document.getElementById('note-input'),
        submitButton: document.getElementById('send-button'),
        transactionList: document.getElementById('transaction-list'),
        errorMessage: document.getElementById('error-message'),
        successMessage: document.getElementById('success-message')
      };
    }
  
    /**
     * Initialize the payments functionality
     */
    async init() {
      try {
        // Check if user has a Unit account
        const accountResponse = await this.fetchWithAuth(`${this.apiBaseUrl}/accounts/me`);
        
        if (!accountResponse.ok) {
          // If account doesn't exist, we might want to prompt the user to create one
          this.showNoAccountMessage();
          return;
        }
        
        const accountData = await accountResponse.json();
        this.accountId = accountData.unitAccountId;
        
        // Update the balance display
        await this.updateBalanceDisplay();
        
        // Load transaction history
        await this.loadTransactionHistory();
        
        // Set up event listeners
        this.setupEventListeners();
        
        this.initialized = true;
        console.log('Unit Payments initialized successfully');
        
      } catch (error) {
        console.error('Failed to initialize Unit Payments:', error);
        this.showError('Could not initialize payment system. Please try again later.');
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
     * Set up event listeners for payment forms
     */
    setupEventListeners() {
      // Send money form submission
      if (this.elements.sendForm) {
        this.elements.sendForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          await this.sendMoney();
        });
      }
      
      // Real-time input validation for amount
      if (this.elements.amountField) {
        this.elements.amountField.addEventListener('input', () => {
          this.validateAmount();
        });
      }
      
      // Real-time input validation for receiver
      if (this.elements.receiverField) {
        this.elements.receiverField.addEventListener('input', () => {
          this.validateReceiver();
        });
      }
    }
  
    /**
     * Update the balance display
     */
    async updateBalanceDisplay() {
      if (!this.elements.balanceDisplay) return;
      
      try {
        const response = await this.fetchWithAuth(`${this.apiBaseUrl}/accounts/balance`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch balance');
        }
        
        const data = await response.json();
        
        // Format the balance with proper currency formatting
        const formattedBalance = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(data.balance / 100); // Assuming balance is in cents
        
        this.elements.balanceDisplay.textContent = formattedBalance;
        
      } catch (error) {
        console.error('Error updating balance:', error);
        this.elements.balanceDisplay.textContent = 'Error loading balance';
      }
    }
  
    /**
     * Load and display transaction history
     */
    async loadTransactionHistory() {
      if (!this.elements.transactionList) return;
      
      try {
        const response = await this.fetchWithAuth(`${this.apiBaseUrl}/transactions/history`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch transaction history');
        }
        
        const data = await response.json();
        
        // Clear existing transactions
        this.elements.transactionList.innerHTML = '';
        
        // If no transactions
        if (data.transactions.length === 0) {
          const emptyMessage = document.createElement('li');
          emptyMessage.className = 'empty-transactions';
          emptyMessage.textContent = 'No transactions yet';
          this.elements.transactionList.appendChild(emptyMessage);
          return;
        }
        
        // Create transaction list items
        data.transactions.forEach(transaction => {
          const li = document.createElement('li');
          li.className = `transaction ${transaction.direction === 'credit' ? 'received' : 'sent'}`;
          
          // Format amount
          const amount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(transaction.amount / 100);
          
          // Format date
          const date = new Date(transaction.createdAt);
          const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          
          li.innerHTML = `
            <div class="transaction-details">
              <span class="transaction-party">${transaction.counterpartyName || 'Transfer'}</span>
              <span class="transaction-date">${formattedDate}</span>
            </div>
            <div class="transaction-amount ${transaction.direction === 'credit' ? 'positive' : 'negative'}">
              ${transaction.direction === 'credit' ? '+' : '-'}${amount}
            </div>
            ${transaction.description ? `<div class="transaction-description">${transaction.description}</div>` : ''}
          `;
          
          this.elements.transactionList.appendChild(li);
        });
        
      } catch (error) {
        console.error('Error loading transactions:', error);
        this.elements.transactionList.innerHTML = '<li class="error-message">Error loading transactions</li>';
      }
    }
  
    /**
     * Send money to another user
     */
    async sendMoney() {
      try {
        // Disable submit button to prevent double submissions
        this.elements.submitButton.disabled = true;
        
        // Get form values
        const receiver = this.elements.receiverField.value.trim();
        const amount = parseFloat(this.elements.amountField.value);
        const note = this.elements.noteField?.value.trim() || '';
        
        // Validate inputs
        if (!this.validateAmount() || !this.validateReceiver()) {
          this.elements.submitButton.disabled = false;
          return;
        }
        
        // Convert amount to cents for the API
        const amountInCents = Math.round(amount * 100);
        
        // Clear any previous error messages
        this.hideError();
        
        // Show loading indicator
        this.showLoading();
        
        // Send the payment request
        const response = await this.fetchWithAuth(`${this.apiBaseUrl}/payments/send`, {
          method: 'POST',
          body: JSON.stringify({
            receiver,
            amount: amountInCents,
            description: note
          })
        });
        
        // Hide loading indicator
        this.hideLoading();
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Payment failed');
        }
        
        const result = await response.json();
        
        // Show success message
        this.showSuccess('Money sent successfully!');
        
        // Reset form
        this.elements.sendForm.reset();
        
        // Update balance display
        await this.updateBalanceDisplay();
        
        // Refresh transaction history
        await this.loadTransactionHistory();
        
      } catch (error) {
        console.error('Error sending money:', error);
        this.showError(error.message || 'Failed to send money. Please try again.');
      } finally {
        // Re-enable submit button
        this.elements.submitButton.disabled = false;
      }
    }
  
    /**
     * Validate the amount input
     */
    validateAmount() {
      if (!this.elements.amountField) return true;
      
      const amount = parseFloat(this.elements.amountField.value);
      
      if (isNaN(amount) || amount <= 0) {
        this.showFieldError(this.elements.amountField, 'Please enter a valid amount');
        return false;
      }
      
      if (amount < 0.01) {
        this.showFieldError(this.elements.amountField, 'Minimum amount is $0.01');
        return false;
      }
      
      if (amount > 10000) {
        this.showFieldError(this.elements.amountField, 'Maximum amount is $10,000');
        return false;
      }
      
      this.clearFieldError(this.elements.amountField);
      return true;
    }
  
    /**
     * Validate the receiver input
     */
    validateReceiver() {
      if (!this.elements.receiverField) return true;
      
      const receiver = this.elements.receiverField.value.trim();
      
      if (!receiver) {
        this.showFieldError(this.elements.receiverField, 'Please enter a recipient');
        return false;
      }
      
      // Either phone or email validation
      const isPhone = /^[0-9]{10,15}$/.test(receiver.replace(/\D/g, ''));
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiver);
      
      if (!isPhone && !isEmail) {
        this.showFieldError(this.elements.receiverField, 'Please enter a valid phone number or email');
        return false;
      }
      
      this.clearFieldError(this.elements.receiverField);
      return true;
    }
  
    /**
     * Show an error message on a specific field
     */
    showFieldError(field, message) {
      // Remove any existing error
      this.clearFieldError(field);
      
      // Add error class to the field
      field.classList.add('error');
      
      // Create and add error message
      const errorElement = document.createElement('div');
      errorElement.className = 'field-error-message';
      errorElement.textContent = message;
      
      // Insert after the field
      field.parentNode.insertBefore(errorElement, field.nextSibling);
    }
  
    /**
     * Clear error message from a field
     */
    clearFieldError(field) {
      // Remove error class
      field.classList.remove('error');
      
      // Remove any existing error message
      const existingError = field.parentNode.querySelector('.field-error-message');
      if (existingError) {
        existingError.remove();
      }
    }
  
    /**
     * Show general error message
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
     * Hide general error message
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
  
    /**
     * Show loading state
     */
    showLoading() {
      if (this.elements.submitButton) {
        this.elements.submitButton.classList.add('loading');
        this.elements.submitButton.innerHTML = '<span class="spinner"></span> Processing...';
      }
    }
  
    /**
     * Hide loading state
     */
    hideLoading() {
      if (this.elements.submitButton) {
        this.elements.submitButton.classList.remove('loading');
        this.elements.submitButton.textContent = 'Send Money';
      }
    }
  
    /**
     * Show message for users without a Unit account
     */
    showNoAccountMessage() {
      // Create a message container if it doesn't exist
      if (!document.getElementById('no-account-message')) {
        const container = document.createElement('div');
        container.id = 'no-account-message';
        container.className = 'no-account-container';
        container.innerHTML = `
          <h3>Set Up Your Payment Account</h3>
          <p>You need to set up a payment account to send and receive money.</p>
          <button id="setup-account-btn" class="primary-btn">Set Up Account</button>
        `;
        
        // Insert at the top of the main content
        const mainContent = document.querySelector('.money-mover') || document.querySelector('main');
        if (mainContent) {
          mainContent.insertBefore(container, mainContent.firstChild);
          
          // Add event listener to the setup button
          document.getElementById('setup-account-btn').addEventListener('click', () => {
            window.location.href = '/account-setup.html';
          });
        }
      }
      
      // Hide the send money form
      if (this.elements.sendForm) {
        this.elements.sendForm.classList.add('hidden');
      }
    }
  }
  
  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    const payments = new UnitPayments();
    payments.init();
    
    // Make available globally for debugging
    window.unitPayments = payments;
  });