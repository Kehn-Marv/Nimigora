/**
 * Subscription Management
 * 
 * Handles premium subscription state using a secure backend API.
 * The backend verifies the Nimiq signature and on-chain transaction.
 */

// ============================================
// Types
// ============================================

export type SubscriptionPlan = 'monthly' | 'yearly';

export interface Subscription {
  address: string;
  plan: SubscriptionPlan;
  startDate: string;     // ISO date string
  expiryDate: string;    // ISO date string
  txHash: string;        // Transaction hash for verification
}

// ============================================
// Core Functions
// ============================================

/**
 * Check if a wallet address has an active (non-expired) subscription.
 * Since we use a backend, we can just fetch the status.
 */
export async function isSubscriptionActive(address?: string | null): Promise<boolean> {
  if (!address) return false;
  
  try {
    const sub = await getSubscriptionInfo();
    if (!sub) return false;
    
    // Check expiry securely on frontend (backend also checks it before serving premium data)
    const now = Date.now();
    const expiry = new Date(sub.expiryDate).getTime();
    
    return now < expiry;
  } catch {
    return false;
  }
}

/**
 * Get the current subscription info from the backend via secure session cookie.
 */
export async function getSubscriptionInfo(): Promise<Subscription | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    const response = await fetch('/api/subscription');
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.subscription || null;
  } catch {
    return null;
  }
}

/**
 * Notify backend to create a new subscription after successful payment.
 */
export async function createSubscription(
  address: string,
  plan: SubscriptionPlan,
  txHash: string
): Promise<Subscription | null> {
  if (typeof window === 'undefined') return null;

  try {
    const response = await fetch('/api/subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, plan, txHash })
    });
    
    if (!response.ok) throw new Error('Failed to create subscription on backend');
    
    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    return null;
  }
}

/**
 * Get human-readable time remaining on the subscription.
 */
export async function getTimeRemaining(address?: string | null): Promise<string> {
  if (!address) return 'No subscription';
  
  const sub = await getSubscriptionInfo();
  if (!sub || sub.address.toLowerCase() !== address.toLowerCase()) {
    return 'No subscription';
  }
  
  const now = Date.now();
  const expiry = new Date(sub.expiryDate).getTime();
  const remaining = expiry - now;
  
  if (remaining <= 0) return 'Expired';
  
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  if (days > 30) {
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} remaining`;
  }
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} remaining`;
  }
  return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
}

/**
 * Get the subscription plan label.
 */
export function getPlanLabel(plan: SubscriptionPlan): string {
  return plan === 'monthly' ? 'Monthly' : 'Yearly';
}

/**
 * Clear subscription (handled by backend session logout).
 */
export async function clearSubscription(): Promise<void> {
  if (typeof window !== 'undefined') {
    await fetch('/api/auth/logout', { method: 'POST' });
  }
}

/**
 * Format expiry date for display.
 */
export function formatExpiryDate(expiryDate: string): string {
  return new Date(expiryDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
