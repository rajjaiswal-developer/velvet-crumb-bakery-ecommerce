import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const getOrderSecretKey = () => {
  const secret = process.env.ORDER_SESSION_SECRET;
  if (!secret) {
    throw new Error('[FATAL SECURITY ERROR]: ORDER_SESSION_SECRET is not configured in environment variables.');
  }
  return new TextEncoder().encode(secret);
};

const ORDER_SECRET_KEY = getOrderSecretKey();
export const ACTIVE_ORDER_COOKIE_NAME = 'active_order_session';

export interface ActiveOrderSessionPayload {
  orderId: string;
}

export async function encryptOrderSession(payload: ActiveOrderSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(ORDER_SECRET_KEY);
}

export async function verifyOrderSession(
  token: string
): Promise<ActiveOrderSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ORDER_SECRET_KEY, {
      algorithms: ['HS256'],
    });

    if (typeof payload.orderId === 'string' && payload.orderId) {
      return { orderId: payload.orderId };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setActiveOrderCookie(orderId: string) {
  const token = await encryptOrderSession({ orderId });
  const cookieStore = cookies();
  cookieStore.set(ACTIVE_ORDER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearActiveOrderCookie() {
  const cookieStore = cookies();
  cookieStore.set(ACTIVE_ORDER_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

export async function getActiveOrderSession(): Promise<ActiveOrderSessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(ACTIVE_ORDER_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyOrderSession(token);
}
