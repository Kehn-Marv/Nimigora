/**
 * Nimiq Pay Mini App Integration
 * 
 * Core module for interacting with the Nimiq Pay wallet via the Mini App SDK.
 * This runs inside the Nimiq Pay WebView — the provider is injected automatically.
 */

// ============================================
// Types
// ============================================

export interface NimiqWalletState {
  connected: boolean;
  address: string | null;
  balance: number | null;   // Balance in NIM (luna / 1e5)
  consensus: boolean;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

// ============================================
// Constants
// ============================================

/** The wallet address where subscription payments are sent */
export const PAYOUT_ADDRESS = process.env.NEXT_PUBLIC_NIMIQ_PAYOUT_ADDRESS || '';

/** NIM amounts (in NIM, not luna) */
export const SUBSCRIPTION_PRICES = {
  monthly: 1,   // 1 NIM for 1 month
  yearly: 5,    // 5 NIM for 1 year (Unlock Forever)
} as const;

/** Convert NIM to Luna (smallest unit) */
export function nimToLuna(nim: number): number {
  return Math.round(nim * 1e5);
}

/** Convert Luna to NIM */
export function lunaToNim(luna: number): number {
  return luna / 1e5;
}

// ============================================
// SDK Initialization
// ============================================

let nimiqProvider: any = null;

/**
 * Initialize the Nimiq Mini App SDK.
 * Must be called client-side only (inside Nimiq Pay WebView).
 * Returns the Nimiq provider for making wallet calls.
 */
export async function initNimiq(): Promise<any> {
  if (nimiqProvider) return nimiqProvider;

  try {
    const { init } = await import('@nimiq/mini-app-sdk');
    nimiqProvider = await init();
    return nimiqProvider;
  } catch (error) {
    console.warn('[Nimiq] SDK init failed — likely not running inside Nimiq Pay:', error);
    return null;
  }
}

/**
 * Get the initialized provider (returns null if not yet initialized).
 */
export function getNimiqProvider(): any {
  return nimiqProvider;
}

// ============================================
// Wallet Operations
// ============================================

/**
 * List the user's Nimiq accounts.
 * Triggers a native approval dialog in Nimiq Pay.
 */
export async function listAccounts(): Promise<string[]> {
  const provider = await initNimiq();
  if (!provider) return [];

  try {
    const accounts = await provider.listAccounts();
    return accounts || [];
  } catch (error) {
    console.error('[Nimiq] listAccounts failed:', error);
    return [];
  }
}

/**
 * Get the NIM balance for an address.
 * Returns balance in NIM (not luna).
 */
export async function getBalance(address: string): Promise<number> {
  const provider = await initNimiq();
  if (!provider) return 0;

  try {
    const balanceLuna = await provider.getBalance(address);
    return lunaToNim(balanceLuna);
  } catch (error) {
    console.error('[Nimiq] getBalance failed:', error);
    return 0;
  }
}

/**
 * Check if consensus is established (blockchain synced).
 */
export async function isConsensusEstablished(): Promise<boolean> {
  const provider = await initNimiq();
  if (!provider) return false;

  try {
    return await provider.isConsensusEstablished();
  } catch (error) {
    console.error('[Nimiq] consensus check failed:', error);
    return false;
  }
}

/**
 * Send a NIM transaction.
 * The user approves via native Nimiq Pay dialog.
 * 
 * @param from - Sender address
 * @param to - Recipient address  
 * @param amountNim - Amount in NIM (will be converted to luna)
 * @returns Transaction result with hash on success
 */
export async function sendTransaction(
  from: string,
  to: string,
  amountNim: number
): Promise<TransactionResult> {
  const provider = await initNimiq();
  if (!provider) {
    return { success: false, error: 'Nimiq provider not available' };
  }

  try {
    const amountLuna = nimToLuna(amountNim);
    
    const txHash = await provider.sendTransaction({
      from,
      to,
      value: amountLuna,
    });

    return { success: true, txHash };
  } catch (error: any) {
    const message = error?.message || 'Transaction failed';
    console.error('[Nimiq] sendTransaction failed:', message);
    
    // Check for common error types
    if (message.includes('insufficient') || message.includes('balance')) {
      return { success: false, error: 'Insufficient balance' };
    }
    if (message.includes('rejected') || message.includes('denied') || message.includes('cancel')) {
      return { success: false, error: 'Transaction cancelled by user' };
    }
    
    return { success: false, error: message };
  }
}

/**
 * Get the current block number.
 */
export async function getBlockNumber(): Promise<number> {
  const provider = await initNimiq();
  if (!provider) return 0;

  try {
    return await provider.getBlockNumber();
  } catch {
    return 0;
  }
}
