// File: c:\Users\User\Downloads\mint-commerce\terra-balance-backend\routes\api\payment.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { PAYMENT_METHODS } = require('../../models/order');

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;

// Get Paystack public key
router.get('/paystack-config', (req, res) => {
  res.json({ publicKey: PAYSTACK_PUBLIC_KEY });
});

// Verify Paystack transaction
router.post('/verify', async (req, res) => {
  const { reference, amount } = req.body;

  try {
    const verificationResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const { status, data } = verificationResponse.data;

    if (
      status && 
      data.status === 'success' && 
      data.amount === amount * 100
    ) {
      res.json({ 
        status: 'success', 
        paymentMethod: PAYMENT_METHODS.PAYPAL 
      });
    } else {
      res.json({ status: 'failed' });
    }
  } catch (error) {
    console.error('Paystack verification error:', error);
    res.status(500).json({ status: 'error' });
  }
});

module.exports = router;