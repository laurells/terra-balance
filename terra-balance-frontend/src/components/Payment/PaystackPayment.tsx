import React, { useState, useEffect } from 'react';
import { PaystackButton } from 'paystack-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

type PaystackPaymentProps = {
  amount: number;
  onSuccess?: (response: any) => void;
  onClose?: () => void;
};

const PaystackPayment: React.FC<PaystackPaymentProps> = ({ 
  amount, 
  onSuccess, 
  onClose 
}) => {
  const auth = useAuth();
  const [publicKey, setPublicKey] = useState('');
  const [reference, setReference] = useState('');

  useEffect(() => {
    // Fetch Paystack public key from backend
    const fetchPaystackConfig = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_PROD_BACKEND_URL}/api/v1/payment/paystack-config`,
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        setPublicKey(response.data.publicKey);
      } catch (error) {
        console.error('Failed to fetch Paystack config', error);
      }
    };

    // Generate unique reference for transaction
    const generateReference = () => {
      return `TB-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    };

    fetchPaystackConfig();
    setReference(generateReference());
  }, []);

  const componentProps = {
    email: auth.user?.email || '',
    amount: amount * 100, // Paystack requires amount in kobo (subunit)
    publicKey: publicKey,
    text: 'Pay Now',
    reference: reference,
    callback: async (response: any) => {
      try {
        // Verify transaction with backend
        const verifyResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_PROD_BACKEND_URL}/api/v1/payment/verify`, 
          {
            reference: response.reference,
            amount: amount
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (verifyResponse.data.status === 'success') {
          onSuccess && onSuccess(response);
        } else {
          console.error('Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error', error);
      }
    },
    onClose: () => {
      onClose && onClose();
    }
  };

  return publicKey ? (
    <PaystackButton {...componentProps} />
  ) : (
    <div>Loading payment...</div>
  );
};

export default PaystackPayment;