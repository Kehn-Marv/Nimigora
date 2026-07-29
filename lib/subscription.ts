/**
 * Subscription Management
 * 
 * Handles premium subscription state using localStorage.
 * Tracks plan type, start/expiry dates, and payment transaction hash.
 * 
 * Note: For a hackathon demo, localStorage is appropriate.
 * A production version would use a backend + on-chain verification.
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
// Constants
// ============================================

const STORAGE_KEY = 'nimigora_subscription';

/** Plan durations in milliseconds */
const PLAN_DURATION: Record<SubscriptionPlan, number> = {
  monthly: 30 * 24 * 60 * 60 * 1000,    // 30 days
  yearly: 365 * 24 * 60 * 60 * 1000,     // 365 days
};

// ============================================
// Core Functions
// ============================================

/**
 * Check if a wallet address has an active (non-expired) subscription.
 */
export function isSubscriptionActive(address?: string | null): boolean {
  if (!address) return false;
  
  try {
    const sub = getSubscriptionInfo();
    if (!sub) return false;
    
    // Must match the connected wallet address
    if (sub.address.toLowerCase() !== address.toLowerCase()) return false;
    
    // Check expiry
    const now = Date.now();
    const expiry = new Date(sub.expiryDate).getTime();
    
    return now < expiry;
  } catch {
    return false;
  }
}

/**
 * Get the current subscription info from localStorage.
 * Returns null if no subscription exists.
 */
export function getSubscriptionInfo(): Subscription | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    
    const sub = JSON.parse(raw) as Subscription;
    
    // Validate structure
    if (!sub.address || !sub.plan || !sub.startDate || !sub.expiryDate || !sub.txHash) {
      return null;
    }
    
    return sub;
  } catch {
    return null;
  }
}

/**
 * Create a new subscription after successful payment.
 */
export function createSubscription(
  address: string,
  plan: SubscriptionPlan,
  txHash: string
): Subscription {
  const now = new Date();
  const duration = PLAN_DURATION[plan];
  const expiryDate = new Date(now.getTime() + duration);
  
  // Check if there's an existing active subscription — extend it
  const existing = getSubscriptionInfo();
  let effectiveStart = now;
  let effectiveExpiry = expiryDate;
  
  if (existing && existing.address.toLowerCase() === address.toLowerCase()) {
    const existingExpiry = new Date(existing.expiryDate).getTime();
    if (existingExpiry > now.getTime()) {
      // Extend from current expiry
      effectiveExpiry = new Date(existingExpiry + duration);
    }
  }
  
  const subscription: Subscription = {
    address,
    plan,
    startDate: effectiveStart.toISOString(),
    expiryDate: effectiveExpiry.toISOString(),
    txHash,
  };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));
  }
  
  return subscription;
}

/**
 * Get human-readable time remaining on the subscription.
 */
export function getTimeRemaining(address?: string | null): string {
  if (!address) return 'No subscription';
  
  const sub = getSubscriptionInfo();
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
 * Clear subscription (disconnect).
 */
export function clearSubscription(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
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
