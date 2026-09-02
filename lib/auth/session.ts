import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const getSecretKey = () => {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('[FATAL SECURITY ERROR]: ADMIN_SESSION_SECRET is not configured in environment variables.');
  }
  return new TextEncoder().encode(secret);
};
const SECRET_KEY = getSecretKey();

const COOKIE_NAME = 'admin_session';

export interface AdminSessionPayload {
  adminId: string;
  email: string;
}

export async function encryptSession(payload: AdminSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET_KEY);
}

export async function verifySession(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ['HS256'],
    });
    return {
      adminId: payload.adminId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function setAdminSessionCookie(payload: AdminSessionPayload) {
  const token = await encryptSession(payload);
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60, // 8 hours
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}
