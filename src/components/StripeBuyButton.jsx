import React, { useEffect, useRef, useState } from 'react';

const STRIPE_BUY_BUTTON_ID = import.meta.env.VITE_STRIPE_BUY_BUTTON_ID;
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

const StripeBuyButton = ({ 
  connectionId, 
  userId, 
  targetUserName, 
  onPaymentSuccess, 
  onPaymentError,
  onClose 
}) => {
  const buttonRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let scriptTag = document.querySelector('script[src="https://js.stripe.com/v3/buy-button.js"]');
    let cleanup = false;

    function handleStripeEvents(event) {
      if (event.data.type === 'stripe-buy-button:checkout-completed') {
        onPaymentSuccess({
          success: true,
          sessionId: event.data.sessionId,
          connectionId,
          userId,
          targetUserName
        });
      } else if (event.data.type === 'stripe-buy-button:checkout-cancelled') {
        onClose();
      } else if (event.data.type === 'stripe-buy-button:checkout-error') {
        onPaymentError(event.data.error || 'Payment failed');
      }
    }

    function renderBuyButton() {
      if (cleanup) return;
      setLoading(false);
      console.log('window.StripeBuyButton:', window.StripeBuyButton);
      if (buttonRef.current) {
        buttonRef.current.innerHTML = '';
        const buyButton = document.createElement('stripe-buy-button');
        buyButton.setAttribute('buy-button-id', STRIPE_BUY_BUTTON_ID);
        buyButton.setAttribute('publishable-key', STRIPE_PUBLISHABLE_KEY);
        buttonRef.current.appendChild(buyButton);
      }
      window.addEventListener('message', handleStripeEvents);
    }

    function waitForStripeBuyButton() {
      if (window.StripeBuyButton && customElements.get('stripe-buy-button')) {
        console.log('StripeBuyButton and custom element are ready!');
        renderBuyButton();
      } else {
        console.log('Waiting for StripeBuyButton or custom element...');
        setTimeout(waitForStripeBuyButton, 100);
      }
    }

    if (!window.StripeBuyButton || !customElements.get('stripe-buy-button')) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.src = 'https://js.stripe.com/v3/buy-button.js';
        scriptTag.async = true;
        scriptTag.onload = waitForStripeBuyButton;
        document.head.appendChild(scriptTag);
      } else {
        scriptTag.onload = waitForStripeBuyButton;
      }
      waitForStripeBuyButton();
    } else {
      renderBuyButton();
    }

    return () => {
      cleanup = true;
      if (buttonRef.current) buttonRef.current.innerHTML = '';
      window.removeEventListener('message', handleStripeEvents);
    };
  }, [connectionId, userId, targetUserName, onPaymentSuccess, onPaymentError, onClose]);

  return (
    <div className="w-full">
      {loading && (
        <div className="text-center py-4 text-gray-500">Loading payment button...</div>
      )}
      <div ref={buttonRef} className="w-full"></div>
    </div>
  );
};

export default StripeBuyButton; 