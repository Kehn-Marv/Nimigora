'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initNimiq,
  listAccounts,
  getBalance as fetchBalance,
  sendTransaction,
  PAYOUT_ADDRESS,
  SUBSCRIPTION_PRICES,
  signMessage,
  type NimiqWalletState,
  type TransactionResult,
} from '@/lib/nimiq';
import {
  isSubscriptionActive,
  createSubscription,
  getSubscriptionInfo,
  getTimeRemaining,
  clearSubscription,
  type SubscriptionPlan,
  type Subscription,
} from '@/lib/subscription';

// ============================================
// Context Types
// ============================================

interface NimiqContextValue {
  // Wallet state
  wallet: NimiqWalletState;
  isLoading: boolean;
  
  // Subscription state
  isSubscribed: boolean;
  subscription: Subscription | null;
  subscriptionTimeRemaining: string;
  
  // Actions
  connectWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  subscribe: (plan: SubscriptionPlan) => Promise<TransactionResult>;
  disconnect: () => void;
}

const defaultContext: NimiqContextValue = {
  wallet: { connected: false, address: null, balance: null, consensus: false },
  isLoading: true,
  isSubscribed: false,
  subscription: null,
  subscriptionTimeRemaining: 'No subscription',
  connectWallet: async () => {},
  refreshBalance: async () => {},
  subscribe: async () => ({ success: false, error: 'Not initialized' }),
  disconnect: () => {},
};

const NimiqContext = createContext<NimiqContextValue>(defaultContext);

// ============================================
// Provider Component
// ============================================

export function NimiqProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<NimiqWalletState>({
    connected: false,
    address: null,
    balance: null,
    consensus: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    const sub = await getSubscriptionInfo();
    setSubscription(sub);
  }, []);

  // Initialize try to restore previous session
  useEffect(() => {
    const init = async () => {
      try {
        // Check if we have a stored address (session persistence)
        const storedAddress = localStorage.getItem('nimigora_wallet_address');
        if (storedAddress) {
          setWallet(prev => ({ ...prev, connected: true, address: storedAddress }));
          
          // Try to refresh balance in background
          try {
            const balance = await fetchBalance(storedAddress);
            setWallet(prev => ({ ...prev, balance }));
          } catch {
            // Balance fetch may fail outside Nimiq Pay that's ok
          }
        }

        // Initialize Nimiq SDK
        await initNimiq();
        
        checkSubscription();
      } catch (error) {
        console.warn('[NimiqProvider] Init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [checkSubscription]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Explicitly request connection first to show the \"Connect to...\" permissions modal
      // This matches the standard mini-app flow and ensures the user approves the connection
      // before we ask them to sign a cryptographic message.
      const accounts = await listAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('User rejected connection or no accounts found');
      }

      // 2. Fetch a cryptographic nonce
      const nonceRes = await fetch('/api/auth/nonce');
      if (!nonceRes.ok) throw new Error('Failed to fetch nonce');
      const { message } = await nonceRes.json();
      
      // 3. Prompt user to sign the message with their private key
      // If the user isn't connected yet, the wallet will first prompt them to choose an account,
      // and then immediately prompt them to sign the message. This avoids browser popup blockers!
      const signatureResult = await signMessage(message);
      
      // 3. Send signature to backend to verify and establish session
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          signatureHex: signatureResult.signature,
          publicKeyHex: signatureResult.publicKey,
        })
      });

      if (!verifyRes.ok) {
        throw new Error('Signature verification failed on backend');
      }
      
      const { address } = await verifyRes.json();
      // ------------------------------------------

      const balance = await fetchBalance(address);
        
        setWallet({
          connected: true,
          address,
          balance,
          consensus: true,
        });
        
        // Persist address for session recovery
        localStorage.setItem('nimigora_wallet_address', address);
        
        // Re-check subscription with new address (now uses secure backend)
        checkSubscription();
    } catch (error) {
      console.error('[NimiqProvider] Connect failed:', error);
      // Ensure we clean up if auth fails mid-way
      disconnect();
    } finally {
      setIsLoading(false);
    }
  }, [checkSubscription]);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!wallet.address) return;
    
    try {
      const balance = await fetchBalance(wallet.address);
      setWallet(prev => ({ ...prev, balance }));
    } catch (error) {
      console.error('[NimiqProvider] Balance refresh failed:', error);
    }
  }, [wallet.address]);

  // Subscribe (process payment)
  const subscribe = useCallback(async (plan: SubscriptionPlan): Promise<TransactionResult> => {
    if (!wallet.address) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (!PAYOUT_ADDRESS) {
      return { success: false, error: 'Payout address not configured' };
    }

    const amount = SUBSCRIPTION_PRICES[plan];
    
    // Check balance first
    if (wallet.balance !== null && wallet.balance < amount) {
      return { success: false, error: `Insufficient balance. Need ${amount} NIM, have ${wallet.balance.toFixed(2)} NIM` };
    }

    // Send payment
    const result = await sendTransaction(wallet.address, PAYOUT_ADDRESS, amount);
    
    if (result.success && result.txHash) {
      // Create subscription record via backend securely
      const sub = await createSubscription(wallet.address, plan, result.txHash);
      if (sub) {
        setSubscription(sub);
      }
      
      // Refresh balance after payment
      await refreshBalance();
    }

    return result;
  }, [wallet.address, wallet.balance, refreshBalance]);

  // Disconnect
  const disconnect = useCallback(() => {
    setWallet({ connected: false, address: null, balance: null, consensus: false });
    clearSubscription();
    setSubscription(null);
    localStorage.removeItem('nimigora_wallet_address');
  }, []);

  // Derived state
  const isSubscribed = subscription !== null && new Date(subscription.expiryDate).getTime() > Date.now();
  const [subscriptionTimeRemaining, setSubscriptionTimeRemaining] = useState('No subscription');

  // Update time remaining async since we use promises now
  useEffect(() => {
    getTimeRemaining(wallet.address).then(setSubscriptionTimeRemaining);
  }, [wallet.address, subscription]);

  const value: NimiqContextValue = {
    wallet,
    isLoading,
    isSubscribed,
    subscription,
    subscriptionTimeRemaining,
    connectWallet,
    refreshBalance,
    subscribe,
    disconnect,
  };

  return (
    <NimiqContext.Provider value={value}>
      {children}
    </NimiqContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useNimiq(): NimiqContextValue {
  return useContext(NimiqContext);
}
