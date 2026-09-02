import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db/client';
import { loginSchema } from '@/lib/validation/schemas';
import { setAdminSessionCookie } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    const rateLimit = await checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const admin = await db.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      await createAuditLog({
        action: 'LOGIN_FAILED',
        details: { email, ip, reason: 'User not found' },
      });
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);

    if (!isMatch) {
      await createAuditLog({
        adminId: admin.id,
        action: 'LOGIN_FAILED',
        details: { email, ip, reason: 'Invalid password' },
      });
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    await setAdminSessionCookie({ adminId: admin.id, email: admin.email });

    await createAuditLog({
      adminId: admin.id,
      action: 'LOGIN',
      details: { email, ip },
    });

    return NextResponse.json({
      success: true,
      data: { id: admin.id, email: admin.email },
    });
  } catch (error) {
    console.error('Error in POST /api/admin/login:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
