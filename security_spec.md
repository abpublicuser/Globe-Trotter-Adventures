# Security Specification - Photo Gallery

## Data Invariants
- A photo must have a non-empty `imageUrl`.
- A photo must have a `userId` that matches the authenticated user during creation.
- Only the creator of a photo can update or delete it.
- All users (even unauthenticated) can read photos.
- `createdAt` must be the server time and immutable after creation.
- `userId` must be immutable after creation.

## The Dirty Dozen Payloads

1. **Anonymous Write**: Attempt to create a photo without being signed in. (Expected: DENIED)
2. **Identity Spoofing**: Attempt to create a photo with a `userId` that doesn't match the auth UID. (Expected: DENIED)
3. **Ghost Field Update**: Attempt to update a photo by adding an unrequested field like `isAdmin: true`. (Expected: DENIED)
4. **Malicious ID**: Attempt to create a photo with a 2KB long string as an ID. (Expected: DENIED)
5. **PII Blanket Leak**: Attempt to list all photos as an unauthenticated user (Wait, this IS allowed by design, all photos are public). Let's rephrase: Attempt to Read a specific user's private data (not applicable here as we only have public photos).
6. **State Shortcutting**: Attempt to update `createdAt` to a past date. (Expected: DENIED)
7. **Orphaned Write**: (Not applicable as we don't have sub-collections here).
8. **Owner Override**: Attempt to change the `userId` of an existing photo. (Expected: DENIED)
9. **Malicious Content**: Attempt to save a 2MB string in the `note` field (assuming 1MB total doc limit, this should fail anyway, but we should enforce size). (Expected: DENIED)
10. **Unauthorized Delete**: Attempt to delete someone else's photo. (Expected: DENIED)
11. **Unauthorized Update**: Attempt to update someone else's note. (Expected: DENIED)
12. **Bypassing Verification**: Attempt to write without email verification (if required, but I'll stick to standard auth for now).

## The Test Runner
(I will implement `firestore.rules` directly following the Fortress rules pattern).
