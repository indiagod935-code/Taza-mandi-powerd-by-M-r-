# Firestore Security Specification (Payload-First Security TDD)

## 1. Data Invariants
1. All Firestore paths default to deny (`allow read, write: if false`).
2. User profiles in `/users/{userId}` contain PII (`email`, `phone`, `fullAddress`) and may ONLY be accessed (`get`, `create`, `update`) by the owning verified Firebase Auth user (`request.auth.uid == userId && request.auth.token.email_verified == true`) or the bootstrapped verified admin (`rp2824173@gmail.com`). Collection-wide `list` is strictly denied to regular users.
3. Activity audit entries in `/activityLogs/{logId}` must have `uid == request.auth.uid`, valid bounded strings, `id == logId`, and `createdAt == request.time` on creation. Regular users may query (`list`) ONLY entries matching `resource.data.uid == request.auth.uid`.
4. Admin documents in `/admins/{adminUid}` are immutable from client SDKs (`allow create, update, delete: if false`).
5. Every string field enforces strict `.size()` bounds and every document ID matches `^[a-zA-Z0-9_\\-]+$`.

## 2. Dirty Dozen Attack Payloads (All Must Fail with PERMISSION_DENIED)
1. Unauthenticated read/write to `/users/usr1`.
2. Unverified email (`email_verified == false`) attempting `create` on `/users/usr1`.
3. Cross-user `get` on `/users/victimUid` by `attackerUid`.
4. Blanket `list` on `/users` by non-admin user.
5. Shadow-field injection (`{ ..., isAdmin: true }`) during `/users/attackerUid` creation.
6. Self-escalation attempt (`create` / `update` on `/admins/attackerUid`).
7. UID spoofing on `/activityLogs/log1` (`{ uid: "victimUid", ... }`) by `attackerUid`.
8. Backdated timestamp spoofing (`createdAt: Timestamp(2020-01-01)`) instead of `request.time`.
9. Oversized payload injection (`actionTitle` > 180 chars or invalid ID with `/` / `$`).
10. Modifying immutable `uid` or `createdAt` during `/users/usr1` update.
11. Deleting another user's activity record `/activityLogs/victimLog`.
12. Unscoped query on `/activityLogs` without `where('uid', '==', auth.uid)` by non-admin.
