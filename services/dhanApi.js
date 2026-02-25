const axios = require('axios');
require('dotenv').config();

class DhanAPI {
  constructor() {
    this.baseUrl = 'https://api.dhan.co';
    this.clientId = process.env.DHAN_CLIENT_ID || '';
    this.accessToken = process.env.DHAN_ACCESS_TOKEN || '';
    this.headers = {
      'Content-Type': 'application/json',
      'access-token': this.accessToken,
      'client-id': this.clientId
    };
  }

  // Update credentials
  updateCredentials(clientId, accessToken) {
    this.clientId = clientId;
    this.accessToken = accessToken;
    this.headers['access-token'] = accessToken;
    this.headers['client-id'] = clientId;
  }

  // Get Holdings
  async getHoldings() {
    try {
      const response = await axios.get(`${this.baseUrl}/holdings`, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.log('Holdings Error:', error.message);
      return null;
    }
  }

  // Get Positions
  async getPositions() {
    try {
      const response = await axios.get(`${this.baseUrl}/positions`, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.log('Positions Error:', error.message);
      return null;
    }
  }

  // Get Order Book
  async getOrders() {
    try {
      const response = await axios.get(`${this.baseUrl}/orders`, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.log('Orders Error:', error.message);
      return null;
    }
  }

  // Place Order
  async placeOrder(orderData) {
    try {
      const order = {
        dhanClientId: this.clientId,
        transactionType: orderData.type || 'BUY',
        exchangeSegment: 'NSE_FNO',
        productType: orderData.productType || 'INTRADAY',
        orderType: orderData.orderType || 'LIMIT',
        validity: 'DAY',
        tradingSymbol: orderData.symbol,
        securityId: orderData.securityId,
        quantity: orderData.quantity,
        price: orderData.price || 0,
        triggerPrice: orderData.triggerPrice || 0,
        afterMarketOrder: false
      };

      const response = await axios.post(`${this.baseUrl}/orders`, order, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.log('Order Error:', error.message);
      return { error: error.message };
    }
  }

  // Modify Order
  async modifyOrder(orderId, modifications) {
    try {
      const response = await axios.put(`${this.baseUrl}/orders/${orderId}`, {
        dhanClientId: this.clientId,
        orderId,
        ...modifications
      }, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.log('Modify Error:', error.message);
      return { error: error.message };
    }
  }

  // Cancel Order
  async cancelOrder(orderId) {
    try {
      const response = await axios.delete(`${this.baseUrl}/orders/${orderId}`, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.log('Cancel Error:', error.message);
      return { error: error.message };
    }
  }

  // Get Fund Limits
  async getFundLimits() {
    try {
      const response = await axios.get(`${this.baseUrl}/fundlimit`, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.log('Fund Error:', error.message);
      return null;
    }
  }

  // Get LTP (Last Traded Price)
  async getLTP(securityId, exchangeSegment = 'NSE_FNO') {
    try {
      const response = await axios.post(`${this.baseUrl}/marketfeed/ltp`, {
        NSE_FNO: [securityId]
      }, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.log('LTP Error:', error.message);
      return null;
    }
  }

  // Get OHLC Data
  async getOHLC(securityId, exchangeSegment = 'NSE_FNO', interval = '5') {
    try {
      const response = await axios.post(`${this.baseUrl}/charts/intraday`, {
        securityId,
        exchangeSegment,
        instrument: 'OPTIDX',
        interval,
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0]
      }, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.log('OHLC Error:', error.message);
      return null;
    }
  }

  // Get Historical Data
  async getHistoricalData(securityId, fromDate, toDate, exchangeSegment = 'NSE_EQ') {
    try {
      const response = await axios.post(`${this.baseUrl}/charts/historical`, {
        securityId,
        exchangeSegment,
        instrument: 'EQUITY',
        fromDate,
        toDate,
        expiryCode: 0
      }, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.log('Historical Error:', error.message);
      return null;
    }
  }

  // Get Option Chain from NSE
  async getOptionChainNSE(index = 'NIFTY') {
    try {
      const url = index === 'NIFTY'
        ? 'https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY'
        : `https://www.nseindia.com/api/option-chain-indices?symbol=${index}`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.nseindia.com/option-chain'
        },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.log('NSE OC Error:', error.message);
      return null;
    }
  }

  // Get Market Status
  async getMarketStatus() {
    try {
      const response = await axios.get('https://www.nseindia.com/api/marketStatus', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.log('Market Status Error:', error.message);
      return null;
    }
  }

  // Get Index Quote
  async getIndexQuote(index = 'NIFTY 50') {
    try {
      const response = await axios.get(`https://www.nseindia.com/api/allIndices`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.data) {
        return response.data.data.find(i => i.index === index);
      }
      return null;
    } catch (error) {
      console.log('Index Quote Error:', error.message);
      return null;
    }
  }
}

module.exports = new DhanAPI();