import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || crypto.randomUUID()
);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // 24 hours
    .sign(secretKey);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, secretKey, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function createSession(address: string) {
  const session = await encrypt({ address });
  const cookieStore = await cookies();
  cookieStore.set('nimigora_session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('nimigora_session')?.value;
  if (!session) return null;
  return await decrypt(session).catch(() => null);
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('nimigora_session');
}
