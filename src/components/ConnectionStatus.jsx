import React, { useState } from 'react';

const ConnectionStatus = ({ 
  connection, 
  currentUserId, 
  targetUserName, 
  onConnect, 
  onPayment, 
  isLoading 
}) => {
  const [showRefundInfo, setShowRefundInfo] = useState(false);
  if (!connection) {
    return (
      <button 
        onClick={onConnect}
        disabled={isLoading}
        className={`btn-primary flex-1 text-lg py-3 ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Connecting...
          </div>
        ) : (
          'Connect'
        )}
      </button>
    );
  }

  const isUserA = connection.user_a_id === currentUserId;
  const currentUserConnected = isUserA ? connection.user_a_connected : connection.user_b_connected;
  const otherUserConnected = isUserA ? connection.user_b_connected : connection.user_a_connected;
  const currentUserPaid = isUserA ? connection.user_a_paid : connection.user_b_paid;
  const otherUserPaid = isUserA ? connection.user_b_paid : connection.user_a_paid;

  // Both users have connected but payment is pending
  if (currentUserConnected && otherUserConnected && connection.status === 'both_connected') {
    if (!currentUserPaid) {
      return (
        <button 
          onClick={onPayment}
          disabled={isLoading}
          className="btn-primary flex-1 text-lg py-3 bg-green-600 hover:bg-green-700"
        >
          {isLoading ? 'Processing...' : 'Complete Payment ($25)'}
        </button>
      );
    } else if (!otherUserPaid) {
      return (
        <>
          <button 
            onClick={() => setShowRefundInfo(true)}
            className="btn-secondary flex-1 text-lg py-3 bg-yellow-100 text-yellow-800 border-yellow-300"
          >
            Waiting for {targetUserName} to pay
          </button>
          {showRefundInfo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full relative">
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
                  onClick={() => setShowRefundInfo(false)}
                >
                  ×
                </button>
                <div className="text-center">
                  <div className="text-2xl mb-4">⏰</div>
                  <div className="text-lg font-semibold mb-2">Payment Pending</div>
                  <div className="text-gray-700 mb-2">
                    If your match does not pay in 48 hours you will be refunded and put back into the match system.
                  </div>
                  <button
                    className="mt-4 px-6 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                    onClick={() => setShowRefundInfo(false)}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      );
    }
  }

  // Both users have paid - show completed state
  if (currentUserPaid && otherUserPaid && connection.status === 'completed') {
    return (
      <button 
        disabled
        className="btn-secondary flex-1 text-lg py-3 bg-green-100 text-green-800 border-green-300"
      >
        ✓ Connected
      </button>
    );
  }

  // Current user has connected but other user hasn't
  if (currentUserConnected && !otherUserConnected) {
    return (
      <button 
        disabled
        className="btn-secondary flex-1 text-lg py-3 bg-blue-100 text-blue-800 border-blue-300"
      >
        Waiting for {targetUserName}...
      </button>
    );
  }

  // Other user has connected but current user hasn't
  if (!currentUserConnected && otherUserConnected) {
    return (
      <button 
        onClick={onConnect}
        disabled={isLoading}
        className={`btn-primary flex-1 text-lg py-3 ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Connecting...
          </div>
        ) : (
          'Connect'
        )}
      </button>
    );
  }

  // Fallback - should not happen
  return (
    <button 
      onClick={onConnect}
      disabled={isLoading}
      className={`btn-primary flex-1 text-lg py-3 ${
        isLoading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      Connect
    </button>
  );
};

export default ConnectionStatus; 