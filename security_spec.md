# Firestore Security Specification — Bismillah Multitrade ERP

## 1. Data Invariants
1. **Default-Deny Catch-All**: All unspecified paths under `/databases/{database}/documents/{document=**}` are strictly denied (`allow read, write: if false;`).
2. **Organization Isolation (`orgKey`)**: Every ERP document in `/erp_sections/{sectionId}` and `/erp_auth_accounts/{accountId}` must carry the exact organization identifier `orgKey == 'BISMILLAH-MULTITRADE-CORP'` (matching `^[a-zA-Z0-9_\-]+$`, length 5..64).
3. **Path Variable Hardening (`isValidId`)**: Document IDs (`sectionId`, `accountId`, `testId`) must be strings of length `1..128` matching `^[a-zA-Z0-9_\-]+$`.
4. **Strict Schema & Key Allowlisting (`hasAll` & `hasOnly`)**:
   - `ErpSectionDoc` must contain all and only `['orgKey', 'sectionId', 'payloadJson', 'updatedAtIso', 'updatedBy']` with bounded string sizes (`payloadJson.size() <= 950000`).
   - `AuthAccountDoc` must contain all and only `['orgKey', 'accountId', 'username', 'pin', 'displayName', 'role', 'fingerprintEnabled', 'credentialId', 'updatedAtIso']` with strict type and length checks (`pin.size() >= 4 && pin.size() <= 32`).
5. **Anti-Update-Gap**: All `update` rules wrap logic in `isValidErpSectionDoc(incoming())` or `isValidAuthAccountDoc(incoming())`, enforce immutable identity keys (`sectionId`, `accountId`, `orgKey`), and restrict modified keys via `incoming().diff(existing()).affectedKeys().hasOnly(...)`.

## 2. The "Dirty Dozen" Payloads
1. **Shadow Field Injection on `erp_sections`**: `{ "orgKey": "BISMILLAH-MULTITRADE-CORP", "sectionId": "invoices", "payloadJson": "[]", "updatedAtIso": "2026-10-11T00:00:00Z", "updatedBy": "admin", "isAdmin": true }` -> Rejected by `hasOnly()`.
2. **Invalid `orgKey` Spoofing**: `{ "orgKey": "ROGUE-ORG", "sectionId": "invoices", "payloadJson": "[]", "updatedAtIso": "2026-10-11T00:00:00Z", "updatedBy": "admin" }` -> Rejected by `data.orgKey == 'BISMILLAH-MULTITRADE-CORP'`.
3. **Path ID Mismatch on `erp_sections`**: Writing `sectionId: "customers"` to `/erp_sections/invoices` -> Rejected by `incoming().sectionId == sectionId`.
4. **Oversized Payload Denial-of-Wallet**: `payloadJson` exceeding 950,000 characters -> Rejected by `data.payloadJson.size() <= 950000`.
5. **Malformed Document ID Poisoning**: Document ID with spaces or special characters (`inv$123`) -> Rejected by `isValidId()`.
6. **Short PIN Creation (`pin.size() < 4`)**: `{ "pin": "12" }` -> Rejected by `data.pin.size() >= 4 && data.pin.size() <= 32`.
7. **Type Poisoning on `fingerprintEnabled`**: `{ "fingerprintEnabled": "yes" }` -> Rejected by `data.fingerprintEnabled is bool`.
8. **Mutating Immutable `accountId` on Update**: Changing `accountId` during update -> Rejected by `incoming().accountId == existing().accountId` and `affectedKeys().hasOnly(...)`.
9. **Mutating Immutable `orgKey` on Update**: Changing `orgKey` during update -> Rejected by `incoming().orgKey == existing().orgKey`.
10. **Unauthenticated/Unscoped List Scraping**: Listing `/erp_sections` without `resource.data.orgKey == 'BISMILLAH-MULTITRADE-CORP'` -> Rejected by `allow list`.
11. **Arbitrary Collection Write**: Writing to `/unprotected_collection/doc1` -> Rejected by global default-deny `match /{document=**}`.
12. **Null/Empty `updatedBy` Field**: `{ "updatedBy": "" }` -> Rejected by `data.updatedBy.size() >= 1 && data.updatedBy.size() <= 128`.
