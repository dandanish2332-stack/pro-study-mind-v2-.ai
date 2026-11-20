# Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default Deny**: All unspecified Firestore paths default to `allow read, write: if false;`.
2. **Verified Admin Identity**: Master Admin privileges are strictly derived from `request.auth != null && request.auth.token.email_verified == true && (request.auth.token.email == 'dandanish2332@gmail.com' || exists(/databases/$(database)/documents/admins/$(request.auth.uid)))`.
3. **Self-Assigned Privilege Prevention**: Students creating or updating their own `/users/{userId}` document can NEVER set `role == 'admin'` or inject `isAdmin: true`.
4. **PII Isolation**: Student email/profile data in `/users/{userId}` and private study records in `/users/{userId}/private/{docId}` can ONLY be read by the owner (`request.auth.uid == userId` or verified email match) or Master Admin. No blanket `list` on `/users`.
5. **Non-PII Public Educational Resources**: `platform_settings/global`, `announcements`, `uploaded_notes`, and `uploaded_pdf_chunks` contain zero PII and enforce `isAdmin()` for all `create`, `update`, and `delete` operations, plus strict schema & size bounds.

## 2. Dirty Dozen Attack Payloads (All Must Return PERMISSION_DENIED)
1. Unauthenticated write to `/platform_settings/global` (`aiTutorEnabled: false`).
2. Student account creating `/admins/{uid}` to escalate privileges.
3. Unverified email spoofing `dandanish2332@gmail.com` with `email_verified: false` writing to `/announcements/{id}`.
4. Authenticated student reading another student's `/users/otherId/private/state`.
5. Authenticated student attempting `list` query across `/users` to harvest emails.
6. Student attempting shadow-field injection (`isAdmin: true`, `role: "admin"`) on `/users/{uid}` create.
7. Oversized `platformName` (5KB string) sent to `/platform_settings/global`.
8. Invalid path variable ID (`../admin` or 200-char string) on `/uploaded_notes/{noteId}`.
9. Non-admin deleting `/uploaded_notes/note-1` or `/uploaded_pdf_chunks/chunk-1`.
10. Non-admin injecting an invalid `storageType: "malicious"` on `/uploaded_notes/{id}`.
11. Unauthenticated delete on `/announcements/{id}`.
12. Ghost field injection (`extraField: "hack"`) on `/announcements/{id}` create or update.
