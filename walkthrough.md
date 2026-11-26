# Security Summary

**Reviewed Files**: 11
**Issues Resolved**: 9

### Issues Resolved
| Area | File | Line | What Was Happening | Impact | Status | How It Was Fixed |
|---|---|---|---|---|---|---|
| Unauthenticated Admin Routes & Data Exposure | `server.ts` | 971–1750 | Administrative endpoints (`/api/messages*`, `/api/db/stats`, `/api/customers`, `/api/orders`, `/api/reservations`, `/api/settings/*` mutations, and order/reservation status updates) accepted unauthenticated HTTP requests and exposed internal filesystem paths (`storageFile`). | High | Fixed | Added `requireAdmin` Bearer token verification (`server.ts:461`) across all admin read/write routes, removed `storageFile` from `/api/db/stats`, and enforced pre-parse token verification before 8 MB media body parsing (`server.ts:661`). |
| Hardcoded & Plaintext Admin Credentials | `src/components/AdminAuthModal.tsx`, `src/components/AdminDashboard.tsx`, `src/services/firebaseService.ts`, `server.ts` | 356–802 | Admin authentication relied on client-side PIN comparisons against hardcoded defaults (`1234`, `admin`, `kds450`), plaintext Firestore `settings/admin_auth` storage, and browser `localStorage`. | High | Fixed | Replaced client PIN checks with server-side `scrypt` password hashing, `ADMIN_PASSCODE` environment support or one-time first-run admin setup (`/api/auth/admin/setup`), expiring HMAC-SHA256 Bearer tokens (`server.ts:397`), and automatic migration of any legacy plaintext credentials on startup (`server.ts:576`). |
| Path Traversal & Unrestricted File Types in Uploads | `server.ts` | 1009–1263 | Image upload endpoints concatenated caller-supplied `itemId`/`postId` directly into `path.join()` and accepted arbitrary image MIME substrings (such as SVG or traversal sequences like `../../../../tmp/pwned`). | High | Fixed | Introduced `sanitizeUploadId` + `saveSafeImageAsset` enforcing an explicit MIME allowlist (`png`, `jpeg`, `jpg`, `webp`, `gif`), a 5 MB decoded limit, and canonical `path.resolve(...).startsWith(resolvedDir + path.sep)` confinement (`server.ts:1063`). |
| Customer PII Exposure & Hardcoded Account Fallback | `server.ts`, `src/components/CartDrawer.tsx` | 1487–1615 | Public callers could list all customer records via `GET /api/customers`, inspect full phone/address details on `GET /api/orders/:id`, and fall back to a hardcoded password (`123456`) when signing in on the storefront. | High | Fixed | Restricted `GET /api/customers` and `GET /api/orders` to authenticated admins, introduced `POST /api/customers/login` verified server-side against `scrypt` hashes, stripped `password`/`passwordHash` via `toPublicCustomer`, and minimized unauthenticated `GET /api/orders/:id` responses to order status fields without phone/address/email. |
| Permissive Firestore Security Rules | `firestore.rules` | 10–116 | Firestore rules allowed unrestricted `read, write: if true` across every document path (`match /{document=**}`), exposing legacy credential docs and permitting arbitrary collection writes. | High | Fixed | Blocked `settings/admin_auth` completely (`allow read, write: if false`), restricted `test/connection` to `get`-only, added schema/type/size/status validators on `orders`, `reservations`, `messages`, `mail`, `settings`, `menu_items`, and `gallery_posts`, and applied default deny (`match /{document=**} { allow read, write: if false; }`). Deployed via `deploy_firebase`. |
| Wildcard CORS & Missing HTTP Security Headers | `server.ts` | 26–109 | API routes echoed `Access-Control-Allow-Origin: *` and leaked `X-Powered-By: Express` without browser hardening headers. | Medium | Fixed | Disabled `x-powered-by`, added `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Cross-Origin-Opener-Policy`, and `Permissions-Policy`, and restricted `/api` CORS to an explicit origin allowlist (`isAllowedApiOrigin`) rejecting unauthorized preflight requests with `403`. |
| Unbounded Body Limits & Brute-Force Exposure | `server.ts` | 114–185, 646–669 | A global 20 MB JSON body parser applied to every endpoint without rate limiting on login/auth or write routes, creating memory exhaustion and brute-force risk. | Medium | Fixed | Reduced the default JSON parser limit to `256kb`, scoped the `8mb` parser strictly to authenticated admin media routes (`LARGE_MEDIA_POST_PATHS`), added bounded sliding-window rate limiters (`authRateLimiter`: 10/min, `publicWriteRateLimiter`: 60/min, `apiReadRateLimiter`: 1200/min), and configured `keepAliveTimeout`/`headersTimeout`/`requestTimeout`. |
| Synchronous Disk Blocking Under Concurrent Traffic | `server.ts` | 482–519, 1071–1079 | Every mutation wrote synchronously via `fs.writeFileSync`, and public GET endpoints re-serialized full JSON payloads on every request, risking event-loop stalls and partial JSON corruption under parallel traffic. | Medium | Fixed | Implemented a coalescing non-blocking atomic persistence queue (`flushDatabaseWriteQueue` writing `.tmp` + `fs.promises.rename`), added `publicSettingsCache` for public settings GET endpoints, cached HTML entry reads, and added process-level `unhandledRejection`/`uncaughtException` guards plus a clean global Express error handler. |
| Vulnerable Third-Party Packages | `package.json` | — | Installed `express`, `nodemailer`, and `sharp` versions carried known security advisories. | Medium | Fixed | Upgraded dependencies to `express@^4.22.1`, `nodemailer@^10.6.1`, and `sharp@^0.35.5` via `install_applet_package`. |

### Safeguards Verified
| Area | File | How It's Protected |
|---|---|---|
| API Keys & Secrets | `server.ts`, `.env.example` | `GEMINI_API_KEY`, `SMTP_PASS`, `ADMIN_PASSCODE`, and `SESSION_SECRET` are consumed strictly server-side via `process.env` and never bundled into browser code. |
| Admin Authentication & Session Handling | `server.ts`, `src/utils/adminSession.ts`, `src/components/AdminAuthModal.tsx` | Passwords are salted and hashed with `crypto.scryptSync`; admin sessions use signed, 8-hour expiring HMAC-SHA256 Bearer tokens held exclusively in JS memory (`currentAdminToken`) with JTI revocation on logout. |
| Upload Path & MIME Confinement | `server.ts` | Uploaded assets must match `png/jpeg/jpg/webp/gif`, stay within 5 MB decoded bytes, use stripped IDs (`sanitizeUploadId`), and resolve strictly inside the target `public/` directory (`resolvedPath.startsWith(resolvedDir + path.sep)`). |
| Public & Authenticated API Access | `server.ts`, `src/services/firebaseService.ts`, `src/App.tsx` | Protected operations require `Authorization: Bearer <token>`, validated before large request bodies are buffered; unauthenticated single-order polling exposes status and item summary without full delivery address or contact details. |
| Firestore Access & Validation | `firestore.rules` | Explicit rules deny `settings/admin_auth` and unknown collections while validating string bounds, price/total/guest numeric ranges, and allowed status enums. |
| Concurrent Load Stability | `server.ts` | Public read caching (`publicSettingsCache`), bounded rate-limiter maps (`MAX_RATE_LIMIT_BUCKETS = 5000`), HTTP request timeouts, and atomic `.tmp` + `rename` async saves keep the server responsive under parallel reads and writes. Live load verification completed 200 concurrent GET requests (836 ms, all HTTP 200) and 20 concurrent order POST writes (71 ms, all HTTP 201) with zero 500 errors and intact JSON persistence. |

## PoC Verification

### Unauthenticated Access to Protected Admin APIs & Path Disclosure
#### Summary
| Field | Value |
|---|---|
| Issue Type | Missing Authentication Check & Server Path Disclosure |
| Impact | High |
| Affected File | `server.ts:461, 661, 971, 999, 1221, 1466, 1579, 1692` |
| Test Scenario | Unauthenticated `GET` and `POST`/`DELETE` requests to `/api/messages`, `/api/customers`, `/api/orders`, `/api/reservations`, `/api/db/stats`, `POST /api/settings/menu`, `DELETE /api/settings/menu-item/item-1`, and `POST /api/settings/upload-menu-image`, followed by an authenticated `GET /api/db/stats` check. |

#### How It Was Fixed
Added `requireAdmin` middleware (`server.ts:461`) across all administrative routes and enforced pre-parse token verification before `largeMediaJsonParser` buffers 8 MB payloads (`server.ts:661–669`). Removed `storageFile` from `/api/db/stats` (`server.ts:999–1006`).

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Unauthenticated requests hit protected admin endpoints and `LARGE_MEDIA_POST_PATHS`. | Requests enter `requireAdmin` (`server.ts:461`) before large body parsing (`server.ts:664`). |
| 2 | `getValidAdminSession(req)` extracts the `Authorization: Bearer` token and finds none (`null`). | Returns HTTP `401` (`Autenticação administrativa necessária.`). |
| 3 | Authenticated `GET /api/db/stats` runs with a valid Bearer token; logout calls `POST /api/auth/admin/logout` and retries `GET /api/db/stats`. | First call returns counts without `storageFile`; logout revokes `session.jti` (`server.ts:765`); subsequent retry returns `401`. |

#### Conclusion
**Fix Verified** - Live test confirmed HTTP `401` across all 8 unauthenticated admin endpoints, clean revocation on logout (`401` after logout), and zero filesystem path leakage in `/api/db/stats`.

---

### Path Traversal & Unrestricted File Type Upload
#### Summary
| Field | Value |
|---|---|
| Issue Type | Path Traversal & Unsafe Upload File Type |
| Impact | High |
| Affected File | `server.ts:1009–1069, 1221–1263` |
| Test Scenario | Authenticated `POST /api/settings/upload-menu-image` with `itemId: "../../../../tmp/pwned"` and a PNG payload, plus an SVG payload (`data:image/svg+xml;base64,...`). |

#### How It Was Fixed
Implemented `sanitizeUploadId` (`server.ts:1012`) to strip non-alphanumeric characters, `ALLOWED_IMAGE_MIMES` (`png`, `jpeg`, `jpg`, `webp`, `gif`), and canonical path verification `resolvedPath.startsWith(resolvedDir + path.sep)` in `saveSafeImageAsset` (`server.ts:1063`).

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Authenticated payload arrives at `/api/settings/upload-menu-image` (`server.ts:1221`). | Enters `saveSafeImageAsset`. |
| 2 | For `itemId: "../../../../tmp/pwned"`, `sanitizeUploadId` strips dots and slashes, producing `tmppwned`, and `path.resolve` verifies confinement within `public/menu_images/`. | Written safely as `/menu_images/tmppwned.png` (`escapedDir: false`). |
| 3 | For `data:image/svg+xml;base64,...`, `ALLOWED_IMAGE_MIMES.has("svg+xml")` returns `false` (`server.ts:1047`). | Rejects request with HTTP `400`. |

#### Conclusion
**Fix Verified** - Directory traversal payloads cannot escape the target asset folder and active content types like SVG are rejected with `400`.

---

### Hardcoded Admin Fallback PINs & Brute-Force Protection
#### Summary
| Field | Value |
|---|---|
| Issue Type | Weak Credential Fallback & Missing Brute-Force Rate Limiting |
| Impact | High |
| Affected File | `server.ts:168, 356, 702–757`, `src/components/AdminAuthModal.tsx:33` |
| Test Scenario | Claiming initial password via `POST /api/auth/admin/setup`, attempting a second `/api/auth/admin/setup`, and sending repeated invalid password attempts to `POST /api/auth/admin/login`. |

#### How It Was Fixed
Removed hardcoded browser PIN lists (`1234`, `admin`, `kds450`) and plaintext Firestore `settings/admin_auth`. Admin passwords are now claimed once via `/api/auth/admin/setup` (or configured via `ADMIN_PASSCODE`), hashed with `scrypt`, and protected by `authRateLimiter` (10 requests/minute per IP).

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Initial `POST /api/auth/admin/setup` hashes and persists the first admin password (`server.ts:716`). | Returns HTTP `201` with a signed Bearer token. |
| 2 | Second `POST /api/auth/admin/setup` hits `if (ENV_ADMIN_PASSCODE || db.adminPasswordHash)` (`server.ts:703`). | Blocked with HTTP `409`. |
| 3 | Rapid invalid login attempts hit `authRateLimiter` (`server.ts:168`) after exceeding 10 auth calls in 60s. | Throttled with HTTP `429` (`Retry-After` header set). |

#### Conclusion
**Fix Verified** - Attackers cannot overwrite an already-configured admin password (`409`) or brute-force passwords unboundedly (`429`).

---

### Unauthenticated Customer Directory & Order PII Exposure
#### Summary
| Field | Value |
|---|---|
| Issue Type | Excessive Data Exposure (Customer & Order PII) |
| Impact | High |
| Affected File | `server.ts:556, 1483–1519, 1579–1615`, `src/components/CartDrawer.tsx:635` |
| Test Scenario | Unauthenticated `GET /api/customers`, `GET /api/orders`, and `GET /api/orders/:id` for an existing delivery order. |

#### How It Was Fixed
Gated `GET /api/customers` and `GET /api/orders` behind `requireAdmin`, moved customer credential lookup to `POST /api/customers/login` verified with `scrypt`, and scoped unauthenticated `GET /api/orders/:id` responses (`server.ts:1596–1614`) to first name, status, items, and totals without `phone`, `email`, or `address`.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Unauthenticated request hits `GET /api/customers` or `GET /api/orders`. | Blocked by `requireAdmin` with HTTP `401`. |
| 2 | Unauthenticated tracker polls `GET /api/orders/ORD-8491` (`server.ts:1584`). | `getValidAdminSession(req)` returns `null`. |
| 3 | Handler builds sanitized status payload (`server.ts:1599–1614`). | Returns HTTP `200` with `status` (`hasPhone: false`, `hasAddress: false`). |

#### Conclusion
**Fix Verified** - Public order tracking continues working while phone numbers, emails, delivery addresses, and customer directories remain inaccessible to unauthenticated callers.

---

### Oversized Payload, Malformed JSON & High-Concurrency Load Resilience
#### Summary
| Field | Value |
|---|---|
| Issue Type | Resource Exhaustion, Permissive CORS & Concurrent Load Stability |
| Impact | Medium |
| Affected File | `server.ts:80–185, 482–519, 646–669, 1071–1079, 1921–1942` |
| Test Scenario | Disallowed `OPTIONS` origin preflight, >256 KB JSON `POST /api/contact`, malformed JSON body, plus a burst of **200 concurrent GET requests** across public endpoints and **20 concurrent `POST /api/orders` writes**. |

#### How It Was Fixed
Enforced `256kb` default JSON parsing limit, strict CORS origin allowlist (`server.ts:40–91`), global error handler (`server.ts:1921`), `publicSettingsCache` serialization cache, and non-blocking coalesced `.tmp` + `rename` writes (`server.ts:494`).

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | `OPTIONS` from `https://evil.example` arrives at `/api` middleware (`server.ts:80`). | `isAllowedApiOrigin` returns `false`; rejects preflight with `403` and no wildcard CORS header. |
| 2 | >256 KB body and malformed JSON hit `defaultJsonParser` and global error handler (`server.ts:1921–1927`). | Returns clean HTTP `413` and `400` JSON responses without stack traces. |
| 3 | 200 simultaneous GETs hit `sendCachedJson` and 20 simultaneous `POST /api/orders` trigger `saveDatabase()`. | All 200 reads returned `200` in 836 ms; all 20 writes returned `201` in 71 ms; `data/internal_db.json` remained valid JSON with zero crashes. |

#### Conclusion
**Fix Verified** - Oversized/malformed payloads are rejected cleanly and the server sustains concurrent read/write bursts without crashing or corrupting state.
