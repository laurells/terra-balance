import axios from 'axios';
import https from 'https';
import crypto from 'crypto';

const baseURL = process.env.NEXT_PUBLIC_PROD_BACKEND_URL;

const api = axios.create({
  baseURL,
  timeout: 10000,
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false, // Only for development
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
  }),
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Add response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'EPROTO') {
      console.error('SSL/TLS Error:', error.message);
      // You might want to show a user-friendly error message here
    }
    return Promise.reject(error);
  }
);

export default api;
