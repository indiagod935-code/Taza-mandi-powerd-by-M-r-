# Architecture Overview — `ताज़ाMandi` (powered by `MARCO 💯`)

## Clean Folder Structure

```
/
├── server/
│   ├── config/env.ts              # Server environment variables & paths
│   ├── middleware/errorHandler.ts # Standardized Express ApiHttpError & asyncHandler
│   ├── routes/
│   │   ├── appBundleRoutes.ts     # /api/app/apk-status & /api/app/download-android-bundle
│   │   └── geocodeRoutes.ts       # /api/geocode/reverse (server-side Google / OSM fallback)
│   ├── utils/androidTwaBundle.ts  # Zero-dependency ZIP generator for Android Studio TWA source
│   └── backendSystem.ts           # Core JSON-persisted domain services (Users, Orders, Activity)
├── server.ts                      # Express + Vite server entrypoint mounting modular routes
└── src/
    ├── config/env.ts              # Client environment constants, owner email, PIN, storage keys
    ├── api/
    │   ├── client.ts              # Typed HTTP client (timeouts, ApiError, JSON guards)
    │   ├── endpoints.ts           # Domain API wrappers (auth, users, orders, catalog, geocode)
    │   └── index.ts
    ├── services/                  # Pure business logic separated from UI components
    │   ├── authService.ts         # Validation, double-password check, Admin RBAC helpers
    │   ├── catalogService.ts      # Catalog sanitization, versioning, merge & CSV export
    │   ├── locationService.ts     # Dual-accuracy GPS + reverse geocode service
    │   ├── orderService.ts        # 11 PM cutoff math & mandi demand aggregation
    │   └── userService.ts         # Backend + Firestore merged Admin directory
    ├── state/
    │   ├── storage.ts             # Crash-safe localStorage helpers
    │   └── STATE_DOCS.md          # State model & transitions documentation
    ├── context/AppContext.tsx     # React global state provider delegating to services
    ├── components/
    │   ├── common/                # Reusable UI primitives (ErrorBoundary, InlineAlert)
    │   └── ...                    # Feature UI views & modals
    ├── data/                      # Localized dictionaries, produce master, accessories master
    ├── hooks/                     # Reusable hooks (usePWAInstall)
    ├── types/                     # Shared TypeScript interfaces
    └── utils/                     # Pure formatters & visual/voice helpers
```

## Key Architectural Principles

1. **Strict Separation of Environment Config (`src/config/env.ts`, `server/config/env.ts`)**: All environment variables, API timeouts, owner credentials, and cache version keys live outside UI components.
2. **Business Logic vs UI Separation**: Components call `src/services/*` and `src/api/*` instead of embedding raw `fetch`, storage versioning, or heavy aggregation logic inside JSX.
3. **Consistent Error Handling**:
   - Backend uses `asyncHandler` + `ApiHttpError` returning `{ success: false, code, error }`.
   - Client uses `apiClient` (`ApiError`) + `InlineAlert` + root `ErrorBoundary`.
4. **Role-Based Access Control (RBAC)**: Owner/Admin controls (wholesale procurement sheet, brand editor pencil, 11 PM cutoff tester, accessory studio uploader, order delivery stage advance) require `isAdminAuthorized`.
