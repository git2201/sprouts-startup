import React, { useState, useEffect } from 'react';

const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/5kQ28q0D17HF3qV2cH5AR0J";

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  connectionId, 
  userId, 
  targetUserName, 
  onPaymentSuccess,
  onPaymentError 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleStripeBuyButtonSuccess = (result) => {
    console.log('Stripe buy button payment success:', result);
    onPaymentSuccess(result);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-4xl mb-4">💳</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Complete Your Connection
          </h2>
          <p className="text-gray-600 mb-6">
            You and {targetUserName} have both committed to connect! 
            Complete your payment of $25 to reveal each other's contact information.
          </p>
          
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Connection Fee</span>
              <span className="font-semibold">$25.00</span>
            </div>
            <div className="text-sm text-gray-500">
              Secure payment processed by Stripe
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.open(STRIPE_PAYMENT_LINK, '_blank')}
              className="w-full py-3 px-6 rounded-xl font-semibold text-lg bg-primary-600 text-white hover:bg-primary-700 transform hover:scale-105 transition-all duration-200"
            >
              Pay $25.00
            </button>
            <button
              onClick={() => {
                // Simulate a successful payment with a mock paymentIntentId
                handleStripeBuyButtonSuccess({
                  success: true,
                  sessionId: 'mock-session',
                  paymentIntentId: 'mock-payment-intent',
                  connectionId,
                  userId,
                  targetUserName
                });
              }}
              className="w-full py-3 px-6 rounded-xl font-semibold text-lg border-2 border-green-400 text-green-700 hover:bg-green-50 transition-all duration-200"
              style={{ background: '#e6ffe6', marginTop: 8 }}
            >
              Mock Payment (Test Only)
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-xl font-semibold text-lg border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            <p>🔒 Your payment information is secure and encrypted</p>
            <p>💳 We accept all major credit cards</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal; 