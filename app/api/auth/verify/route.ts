import { NextResponse } from 'next/server';
import * as Nimiq from '@nimiq/core';
import { createSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const { message, signatureHex, publicKeyHex } = await request.json();

    if (!message || !signatureHex || !publicKeyHex) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Format the data precisely as Nimiq Hub / SDK prefixes it
    const prefix = '\x16Nimiq Signed Message:\n';
    const data = prefix + message.length.toString() + message;
    
    // 2. Hash it
    const dataBytes = Buffer.from(data, 'utf8');
    const hash = Nimiq.Hash.computeSha256(dataBytes);

    // 3. Verify the cryptographic signature using Nimiq's core library
    const signature = Nimiq.Signature.fromHex(signatureHex);
    const publicKey = Nimiq.PublicKey.fromHex(publicKeyHex);
    
    const isValid = publicKey.verify(signature, hash);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 4. Derive the address from the verified public key
    const address = publicKey.toAddress().toUserFriendlyAddress();

    // 5. Signature is mathematically valid and matches the user! Create a secure HTTPOnly session.
    await createSession(address);

    return NextResponse.json({ success: true, address });
  } catch (error: any) {
    console.error('Signature verification failed:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
