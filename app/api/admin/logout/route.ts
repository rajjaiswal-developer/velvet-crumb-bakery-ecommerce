import { NextResponse } from 'next/server';
import { clearAdminSessionCookie, getAdminSession } from '@/lib/auth/session';
import { createAuditLog } from '@/lib/audit';

export async function POST() {
  try {
    const session = await getAdminSession();
    if (session) {
      await createAuditLog({
        adminId: session.adminId,
        action: 'LOGOUT',
        details: { email: session.email },
      });
    }

    await clearAdminSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/admin/logout:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
