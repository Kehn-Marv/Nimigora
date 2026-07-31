import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const nonce = crypto.randomBytes(16).toString('hex');
  // Following standard SIWE / Nimiq Sign-in patterns
  const message = `Sign in to Nimigora\nNonce: ${nonce}\nOrigin: ${process.env.NEXT_PUBLIC_APP_URL || 'https://nimigora.vercel.app'}`;
  
  return NextResponse.json({ nonce, message });
}
