const unit = require('../config/unit');

const unitService = {
  async listAccounts(params) {
    try {
      const response = await unit.accounts.list(params);
      return response.data;
    } catch (error) {
      console.error('Error listing Unit accounts:', error);
      throw error;
    }
  },

  async createCustomer(customerData) {
    try {
      const response = await unit.customers.create({
        type: 'individualCustomer',
        attributes: {
          fullName: {
            first: customerData.firstName,
            last: customerData.lastName
          },
          ssn: customerData.ssn,
          dateOfBirth: customerData.dateOfBirth,
          address: {
            street: customerData.street,
            city: customerData.city,
            state: customerData.state,
            postalCode: customerData.zipCode,
            country: 'US'
          },
          email: customerData.email,
          phone: {
            countryCode: '1',
            number: customerData.phone.replace(/\D/g, '')
          }
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating Unit customer:', error);
      throw error;
    }
  },
  
  async createDepositAccount(customerId) {
    try {
      const response = await unit.accounts.create({
        type: 'depositAccount',
        attributes: {
          depositType: 'checking',
          tags: {
            purpose: 'pagomigo-wallet'
          }
        },
        relationships: {
          customer: {
            data: {
              type: 'customer',
              id: customerId
            }
          }
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating Unit account:', error);
      throw error;
    }
  },
  
  async getAccount(accountId) {
    try {
      const response = await unit.accounts.get(accountId);
      return response.data;
    } catch (error) {
      console.error('Error getting Unit account:', error);
      throw error;
    }
  },
  
  async sendMoney(fromAccountId, toAccountId, amountInCents, description) {
    try {
      const response = await unit.bookPayments.create({
        type: 'bookPayment',
        attributes: {
          amount: amountInCents,
          description: description
        },
        relationships: {
          account: {
            data: {
              type: 'account',
              id: fromAccountId
            }
          },
          counterpartyAccount: {
            data: {
              type: 'account',
              id: toAccountId
            }
          }
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error sending money via Unit:', error);
      throw error;
    }
  },
  
  async listTransactions(accountId) {
    try {
      const response = await unit.transactions.list({
        filter: {
          accountId: accountId
        },
        page: {
          limit: 50
        },
        sort: '-createdAt'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error listing Unit transactions:', error);
      throw error;
    }
  }
};

module.exports = unitService;
