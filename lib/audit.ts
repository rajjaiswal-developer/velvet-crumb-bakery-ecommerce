import { db } from './db/client';
import { Prisma } from '@prisma/client';

export interface AuditLogParams {
  adminId?: string;
  action: string;
  details: Record<string, unknown>;
}

export async function createAuditLog({ adminId, action, details }: AuditLogParams) {
  try {
    return await db.auditLog.create({
      data: {
        adminId: adminId || null,
        action,
        details: details as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log entry:', error);
  }
}
