import { db, adminRef } from '../config/firebase';
import { logger } from './logger';

export async function logEvent(action: string, target: string, result: string, userId?: string) {
  logger.info({ action, target, result, userId }, `Audit log: ${action} on ${target} -> ${result}`);
  try {
    await db.collection('audit_log').add({
      action,
      target,
      result,
      userId: userId || 'system',
      timestamp: adminRef.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    logger.error({ error }, 'Failed to write to audit_log collection');
  }
}
