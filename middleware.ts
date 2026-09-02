import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const getAdminSecretKey = () => {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('[FATAL SECURITY ERROR]: ADMIN_SESSION_SECRET is not configured in environment variables.');
  }
  return new TextEncoder().encode(secret);
};
const SECRET_KEY = getAdminSecretKey();

const COOKIE_NAME = 'admin_session';

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ['HS256'],
    });
    return !!payload?.adminId;
  } catch (err) {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  const isAdminApiRoute = pathname.startsWith('/api/admin');
  const isAdminPageRoute = pathname.startsWith('/admin');

  if (!isAdminApiRoute && !isAdminPageRoute) {
    return NextResponse.next();
  }

  const isLoginApi = pathname === '/api/admin/login';
  const isLoginPage = pathname === '/admin/login';

  const authenticated = await isAuthenticated(request);

  if (isAdminApiRoute) {
    if (isLoginApi) {
      return NextResponse.next();
    }
    if (!authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // CSRF Defense-in-Depth for Admin State-Changing Routes (POST, PUT, DELETE, PATCH)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const secFetchSite = request.headers.get('sec-fetch-site');
      if (secFetchSite === 'cross-site') {
        return NextResponse.json({ success: false, error: 'Forbidden cross-site request' }, { status: 403 });
      }

      const origin = request.headers.get('origin');
      if (origin && origin !== request.nextUrl.origin) {
        return NextResponse.json({ success: false, error: 'Forbidden origin mismatch' }, { status: 403 });
      }
    }

    return NextResponse.next();
  }

  if (isAdminPageRoute) {
    if (isLoginPage) {
      if (authenticated) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.next();
    }
    if (!authenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
