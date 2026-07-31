import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getSubscription, saveSubscription } from '@/lib/db';

const PLAN_DURATION: Record<string, number> = {
  monthly: 30 * 24 * 60 * 60 * 1000,
  yearly: 365 * 24 * 60 * 60 * 1000,
};

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.address) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await getSubscription(session.address);
    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Failed to get subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.address) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { address, plan, txHash } = await request.json();

    if (address.toLowerCase() !== session.address.toLowerCase()) {
      return NextResponse.json({ error: 'Address mismatch' }, { status: 403 });
    }

    if (!PLAN_DURATION[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // In a full production app, we would query the Nimiq network here
    // to verify that txHash is a valid transaction to our payout address
    // with the correct amount.
    // e.g. const tx = await nimiqRpc.getTransactionByHash(txHash);
    // if (tx.to !== PAYOUT_ADDRESS || tx.value < expectedAmount) throw Error;

    const now = new Date();
    const duration = PLAN_DURATION[plan];
    
    // Check if extending
    const existing = await getSubscription(address);
    let effectiveStart = now;
    let effectiveExpiry = new Date(now.getTime() + duration);

    if (existing && existing.expiryDate) {
      const existingExpiry = new Date(existing.expiryDate).getTime();
      if (existingExpiry > now.getTime()) {
        effectiveExpiry = new Date(existingExpiry + duration);
      }
    }

    const subscription = {
      address,
      plan,
      startDate: effectiveStart.toISOString(),
      expiryDate: effectiveExpiry.toISOString(),
      txHash,
    };

    await saveSubscription(subscription);

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error('Failed to create subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
