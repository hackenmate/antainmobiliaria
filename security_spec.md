# Security Specification — Realty Anta Terra

## 1. Data Invariants
- Every document in `mediaAssets` is publicly readable for landing page showcase rendering, but can ONLY be created, updated, or deleted by a verified administrator (`email_verified == true` and bootstrapped admin email `moneda1solperu@gmail.com` or `/admins/{uid}`).
- Every document in `inquiries` contains client PII (`clientName`, `clientEmail`, `clientPhone`). It MUST only be readable (`get`/`list`) by the creating owner (`resource.data.userId == request.auth.uid`) or a verified admin.
- On `create` for `inquiries`, `request.resource.data.userId` MUST equal `request.auth.uid`, `status` MUST be `'pending'`, and `createdAt == request.time && updatedAt == request.time`.
- On `update` for `inquiries`, non-admin owners can only edit `notes` or `visitDate` while `status == 'pending'`, and `userId`/`createdAt` remain immutable. Only admins may transition `status` (`pending` -> `scheduled` -> `completed`).
- Document IDs must match `^[a-zA-Z0-9_\-]+$` and be `<= 128` chars.
- Every string field enforces strict `.size()` bounds and keys checks (`hasAll` + `hasOnly`).

## 2. Adversarial "Dirty Dozen" Payloads (All Must Fail with PERMISSION_DENIED)
1. Unauthenticated create on `/mediaAssets/hack1`
2. Authenticated non-admin create on `/mediaAssets/hack2`
3. Admin create on `/mediaAssets/hack3` with shadow field `isFeatured: true`
4. Admin create on `/mediaAssets/hack4` with invalid `url` (`javascript:alert(1)`)
5. Unauthenticated create on `/inquiries/inq1`
6. Authenticated user creating `/inquiries/inq2` with `userId: "someone_else"` (Identity Spoofing)
7. Authenticated user creating `/inquiries/inq3` with `status: "completed"` (State Shortcutting)
8. Authenticated user creating `/inquiries/inq4` with `createdAt` set to a client timestamp instead of `request.time`
9. Authenticated user reading another user's `/inquiries/otherInq` (`get`)
10. Authenticated user running an unfiltered `list` on `/inquiries` without `where('userId', '==', uid)`
11. Authenticated owner updating `/inquiries/inq5` to set `status: "scheduled"` or modifying `userId`
12. Unverified email user (`email_verified: false`) attempting any write even with admin email string
