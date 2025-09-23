// N-Genius Payment Service
import axios from 'axios';

class NGeniusService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Lazy loading of environment variables
  getConfig() {
    return {
      apiKey: process.env.N_GENIUS_API_KEY,
      outletId: process.env.N_GENIUS_OUTLET_ID,
      tokenUrl: process.env.N_GENIUS_TOKEN_URL,
      transactionUrlBase: process.env.N_GENIUS_TRANSACTION_URL_BASE
    };
  }

  // Get access token from N-Genius
  async getAccessToken() {
    try {
      // Check if current token is still valid
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      // Get config with lazy loading
      const config = this.getConfig();

      // Debug: Log environment variables
      console.log('🔍 N-Genius Debug:');
      console.log('API Key:', config.apiKey ? 'SET' : 'NOT SET');
      console.log('Outlet ID:', config.outletId);
      console.log('Token URL:', config.tokenUrl);
      console.log('Transaction URL Base:', config.transactionUrlBase);

      // Decode API key from Base64
      const decodedApiKey = Buffer.from(config.apiKey, 'base64').toString('utf8');
      const authString = Buffer.from(`${decodedApiKey}:`).toString('base64');
      
      // Debug: Log what we're sending
      console.log('🔍 Request Debug:');
      console.log('API Key (first 10 chars):', config.apiKey ? config.apiKey.substring(0, 10) + '...' : 'NOT SET');
      console.log('Decoded API Key (first 20 chars):', decodedApiKey.substring(0, 20) + '...');
      console.log('Auth String (first 20 chars):', authString.substring(0, 20) + '...');
      console.log('Token URL:', config.tokenUrl);
      
      // Use working configuration from test
      const response = await axios.post(
        config.tokenUrl,
        {
          grant_type: 'client_credentials'
        },
        {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/vnd.ni-identity.v1+json',
            'Accept': 'application/vnd.ni-identity.v1+json'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer

      return this.accessToken;
    } catch (error) {
      console.error('Error getting N-Genius access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with N-Genius');
    }
  }

  // Create payment order
  async createPaymentOrder(orderData) {
    try {
      const accessToken = await this.getAccessToken();
      const config = this.getConfig();
      
      // Debug: Log transaction URL
      console.log('🔍 Payment Order Debug:');
      console.log('Transaction URL Base:', config.transactionUrlBase);
      console.log('Outlet ID:', config.outletId);
      console.log('Full Transaction URL:', `${config.transactionUrlBase}${config.outletId}/orders`);
      
      const transactionUrl = `${config.transactionUrlBase}${config.outletId}/orders`;

      const paymentData = {
        action: "PURCHASE",
        amount: {
          currencyCode: orderData.currency || "AED",
          value: Math.round(orderData.total * 100) // Convert to minor units
        },
        merchantOrderReference: orderData.orderNumber,
        emailAddress: orderData.customer.email,
        billingAddress: {
          firstName: orderData.customer.name.split(' ')[0] || orderData.customer.name,
          lastName: orderData.customer.name.split(' ').slice(1).join(' ') || '',
          address1: orderData.customer.address.street,
          city: orderData.customer.address.city,
          state: orderData.customer.address.state,
          postCode: orderData.customer.address.zipCode,
          countryCode: "AE"
        },
        returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?orderId=${orderData.orderId}`,
        cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-cancelled?orderId=${orderData.orderId}`,
        language: "en"
      };

      // Debug: Log payment data
      console.log('🔍 Payment Data Debug:');
      console.log('Payment Data:', JSON.stringify(paymentData, null, 2));
      
      const response = await axios.post(transactionUrl, paymentData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.ni-payment.v2+json',
          'Accept': 'application/vnd.ni-payment.v2+json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating N-Genius payment order:', error.response?.data || error.message);
      throw new Error('Failed to create payment order');
    }
  }

  // Verify webhook signature (optional but recommended)
  async getPaymentStatus(orderReference) {
    try {
      const accessToken = await this.getAccessToken();
      const config = this.getConfig();
      
      const statusUrl = `${config.transactionUrlBase}${config.outletId}/orders/${orderReference}`;
      
      console.log('🔍 Checking payment status for:', orderReference);
      console.log('Status URL:', statusUrl);
      
      const response = await axios.get(statusUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.ni-payment.v2+json'
        }
      });
      
      console.log('✅ Payment status retrieved:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }

  verifyWebhookSignature(payload, signature) {
    // Implement webhook signature verification if N-Genius provides it
    return true; // Placeholder
  }
}

export default new NGeniusService();
