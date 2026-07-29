'use client';

import { useState } from 'react';
import { useNimiq } from './NimiqProvider';
import { SUBSCRIPTION_PRICES } from '@/lib/nimiq';
import { LockKeyhole, X, Crown, Flash, Wallet, CheckCircle, AlertCircle, Loader } from 'reicon-react';
import type { SubscriptionPlan } from '@/lib/subscription';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PaywallModal({ isOpen, onClose, onSuccess }: PaywallModalProps) {
  const { wallet, isLoading, connectWallet, subscribe } = useNimiq();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setError(null);
    setSelectedPlan(plan);

    // If wallet not connected, connect first
    if (!wallet.connected) {
      await connectWallet();
      return;
    }

    setProcessing(true);
    try {
      const result = await subscribe(plan);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
          setSuccess(false);
          setSelectedPlan(null);
        }, 2000);
      } else {
        setError(result.error || 'Payment failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !processing) {
      onClose();
    }
  };

  return (
    <div className="paywall-backdrop" onClick={handleBackdropClick}>
      <div className="paywall-modal">
        {/* Close button */}
        <button 
          className="paywall-close" 
          onClick={onClose}
          disabled={processing}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Success state */}
        {success ? (
          <div className="paywall-success">
            <div className="paywall-success-icon">
              <CheckCircle size={48} />
            </div>
            <h3>Welcome to Nimigora Premium!</h3>
            <p>You now have full access to all exclusive stories.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="paywall-header">
              <div className="paywall-lock-icon">
                <LockKeyhole size={24} />
              </div>
              <h2 className="paywall-title">Unlock Exclusive Stories</h2>
              <p className="paywall-subtitle">
                Get access to our best investigative reporting handpicked by our 
                editorial algorithm from each of our six beats.
              </p>
            </div>

            {/* Plans */}
            <div className="paywall-plans">
              <button
                className={`paywall-plan ${selectedPlan === 'monthly' ? 'selected' : ''}`}
                onClick={() => handleSubscribe('monthly')}
                disabled={processing}
              >
                <div className="paywall-plan-icon">
                  <Flash size={20} />
                </div>
                <div className="paywall-plan-info">
                  <h4>Unlock Monthly</h4>
                  <p>Full access for 30 days</p>
                </div>
                <div className="paywall-plan-price">
                  <span className="paywall-price-amount">{SUBSCRIPTION_PRICES.monthly}</span>
                  <span className="paywall-price-currency">NIM</span>
                </div>
              </button>

              <button
                className={`paywall-plan paywall-plan-premium ${selectedPlan === 'yearly' ? 'selected' : ''}`}
                onClick={() => handleSubscribe('yearly')}
                disabled={processing}
              >
                <div className="paywall-plan-badge">BEST VALUE</div>
                <div className="paywall-plan-icon">
                  <Crown size={20} />
                </div>
                <div className="paywall-plan-info">
                  <h4>Unlock Forever</h4>
                  <p>Full access for 1 year</p>
                </div>
                <div className="paywall-plan-price">
                  <span className="paywall-price-amount">{SUBSCRIPTION_PRICES.yearly}</span>
                  <span className="paywall-price-currency">NIM</span>
                </div>
                <div className="paywall-plan-savings">
                  Save {Math.round((1 - (SUBSCRIPTION_PRICES.yearly / (SUBSCRIPTION_PRICES.monthly * 12))) * 100)}%
                </div>
              </button>
            </div>

            {/* Wallet status */}
            {!wallet.connected && (
              <div className="paywall-wallet-notice">
                <Wallet size={16} />
                <span>Your Nimiq Pay wallet will be connected to process payment</span>
              </div>
            )}

            {wallet.connected && wallet.balance !== null && (
              <div className="paywall-balance">
                <Wallet size={14} />
                <span>Balance: {wallet.balance.toFixed(2)} NIM</span>
              </div>
            )}

            {/* Processing state */}
            {processing && (
              <div className="paywall-processing">
                <Loader size={20} className="paywall-spinner" />
                <span>Processing payment...</span>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="paywall-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Footer */}
            <p className="paywall-footer-text">
              Payments are processed via Nimiq Pay. Your subscription activates instantly.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
