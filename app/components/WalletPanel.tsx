'use client';

import { useState } from 'react';
import { useNimiq } from './NimiqProvider';
import { formatExpiryDate, getPlanLabel } from '@/lib/subscription';
import { Wallet, Copy, Check, X, Crown, Logout, Refresh } from 'reicon-react';

interface WalletPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletPanel({ isOpen, onClose }: WalletPanelProps) {
  const {
    wallet,
    isLoading,
    isSubscribed,
    subscription,
    subscriptionTimeRemaining,
    connectWallet,
    refreshBalance,
    disconnect,
  } = useNimiq();

  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (!isOpen) return null;

  const copyAddress = async () => {
    if (!wallet.address) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback copy
      const el = document.createElement('textarea');
      el.value = wallet.address;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    setTimeout(() => setRefreshing(false), 500);
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="wallet-backdrop" onClick={handleBackdropClick}>
      <div className="wallet-panel">
        {/* Header */}
        <div className="wallet-panel-header">
          <h3>
            <Wallet size={18} />
            Nimiq Wallet
          </h3>
          <button className="wallet-panel-close" onClick={onClose} aria-label="Close wallet">
            <X size={18} />
          </button>
        </div>

        {!wallet.connected ? (
          /* Not connected state */
          <div className="wallet-connect-prompt">
            <div className="wallet-connect-icon">
              <Wallet size={32} />
            </div>
            <p>Connect your Nimiq Pay wallet to access premium features</p>
            <button 
              className="wallet-connect-btn"
              onClick={connectWallet}
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        ) : (
          /* Connected state */
          <>
            {/* Address */}
            <div className="wallet-section">
              <label className="wallet-label">Address</label>
              <div className="wallet-address-row">
                <span className="wallet-address">{truncateAddress(wallet.address!)}</span>
                <button className="wallet-copy-btn" onClick={copyAddress} aria-label="Copy address">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Balance */}
            <div className="wallet-section">
              <label className="wallet-label">Balance</label>
              <div className="wallet-balance-row">
                <span className="wallet-balance-amount">
                  {wallet.balance !== null ? `${wallet.balance.toFixed(2)} NIM` : '---'}
                </span>
                <button
                  className={`wallet-refresh-btn ${refreshing ? 'spinning' : ''}`}
                  onClick={handleRefresh}
                  aria-label="Refresh balance"
                >
                  <Refresh size={14} />
                </button>
              </div>
            </div>

            {/* Subscription */}
            <div className="wallet-section">
              <label className="wallet-label">Subscription</label>
              {isSubscribed && subscription ? (
                <div className="wallet-sub-active">
                  <div className="wallet-sub-badge">
                    <Crown size={14} />
                    <span>Premium {getPlanLabel(subscription.plan)}</span>
                  </div>
                  <p className="wallet-sub-expiry">
                    Expires: {formatExpiryDate(subscription.expiryDate)}
                  </p>
                  <p className="wallet-sub-remaining">{subscriptionTimeRemaining}</p>
                </div>
              ) : (
                <div className="wallet-sub-inactive">
                  <p>No active subscription</p>
                  <a href="/exclusive" className="wallet-sub-cta">Browse Exclusive Stories →</a>
                </div>
              )}
            </div>

            {/* Disconnect */}
            <button className="wallet-disconnect-btn" onClick={disconnect}>
              <Logout size={14} />
              Disconnect Wallet
            </button>
          </>
        )}
      </div>
    </div>
  );
}
