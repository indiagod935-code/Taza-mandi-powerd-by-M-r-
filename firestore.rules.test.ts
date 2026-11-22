/**
 * Security Rules Verification Spec for the Dirty Dozen Payloads.
 * Intended for documentation & emulator/rules-unit-testing validation.
 */
export const DIRTY_DOZEN_SECURITY_CASES = [
  { id: 1, operation: 'get /users/usr1 (unauthenticated)', expected: 'PERMISSION_DENIED' },
  { id: 2, operation: 'create /users/usr1 (email_verified: false)', expected: 'PERMISSION_DENIED' },
  { id: 3, operation: 'get /users/victimUid (as attackerUid)', expected: 'PERMISSION_DENIED' },
  { id: 4, operation: 'list /users (as non-admin)', expected: 'PERMISSION_DENIED' },
  { id: 5, operation: 'create /users/attackerUid with extra key isAdmin:true', expected: 'PERMISSION_DENIED' },
  { id: 6, operation: 'create /admins/attackerUid', expected: 'PERMISSION_DENIED' },
  { id: 7, operation: 'create /activityLogs/log1 with uid != auth.uid', expected: 'PERMISSION_DENIED' },
  { id: 8, operation: 'create /activityLogs/log1 with backdated createdAt', expected: 'PERMISSION_DENIED' },
  { id: 9, operation: 'create /activityLogs/bad!id with oversized actionTitle', expected: 'PERMISSION_DENIED' },
  { id: 10, operation: 'update /users/usr1 altering createdAt or uid', expected: 'PERMISSION_DENIED' },
  { id: 11, operation: 'delete /activityLogs/victimLog (as non-admin)', expected: 'PERMISSION_DENIED' },
  { id: 12, operation: 'list /activityLogs without uid == auth.uid filter', expected: 'PERMISSION_DENIED' },
] as const;
