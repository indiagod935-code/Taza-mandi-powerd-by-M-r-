# State Management Documentation (`ताज़ाMandi` / `MARCO 💯`)

This document explains how client and server state are structured, persisted, and transitioned across the platform.

## 1. Central Client State Store (`src/context/AppContext.tsx`)

The React Context (`useApp()`) exposes clearly separated state slices backed by safe storage helpers (`src/state/storage.ts`) and domain services (`src/services/`):

| Slice | Storage Key (`STORAGE_KEYS`) | Owner / Persistence | Description |
| :--- | :--- | :--- | :--- |
| `user` | `marco100_user` | Client localStorage + Backend `.data/users.json` + Firestore `/users` | Active customer/owner profile, login method, and `savedAddresses[]`. Defaults to guest (`isLoggedIn: false`). |
| `produceList` | `tazamandi_master_produce_v54` | `catalogService` + `/api/catalog` | 121-item produce catalog sanitized via `PRODUCT_VISUAL_REGISTRY`. Bumped cleanly via `ENV_CONFIG.SYNC_VERSION`. |
| `accessoriesList` | `tazamandi_accessories_v2` | `catalogService` | MARCO 100 verified mobile accessories catalog, merged safely without losing custom studio items. |
| `produceCart` & `accessoryCart` | `marco100_cart_produce`, `marco100_cart_accessories` | LocalStorage + Refs (`produceCartRef`, `accessoryCartRef`) | Ref-mirrored cart weights (kg) and accessory quantities to prevent stale closure bugs during order placement. |
| `orders` | `marco100_orders` + `/api/orders` | Backend authoritative + local cache | Live customer & society orders driving the 24x7 APMC Vashi procurement engine. |
| `isBefore11PmCutoff` | Computed / `cutoffOverride` | `orderService.isNaturalBeforeCutoff` | Determines whether orders join **Tomorrow 10 AM** or roll over to **Day-After 10 AM**. |
| `lang` | `marco100_lang` | Client localStorage | Active UI language (`en` default, supports 18 languages). |
| `isAdminAuthorized` | Ephemeral state in `App.tsx` | Derived (`!isAdminLocked && (isAdminUnlocked || authService.isOwnerEmail(user.email))`) | Strictly isolates Owner/Admin procurement, studio editing, and stage-simulation controls from regular shoppers. |

## 2. State Transitions & Order Lifecycle

1. **Cart Mutation** (`setProduceCartQty`, `addProduceToCart`, `setAccessoryCartQty`): Updates state and synchronous refs immediately.
2. **Order Placement** (`placeOrder`): Computes weight/margin totals, resolves delivery batch (`tomorrow_morning` vs `day_after_morning`), syncs to `POST /api/orders`, clears carts, and triggers referral qualification checks.
3. **Order Stage Transitions** (`updateOrderStatus`): Strictly gated behind `isAdminAuthorized` (`ordered` -> `procured_at_mandi` -> `packed` -> `out_for_delivery` -> `delivered`).

## 3. Error Handling Strategy

- **API Calls (`src/api/client.ts`)**: All `fetch` calls go through `apiClient`, throwing structured `ApiError` objects with HTTP status, code, timeout abort (`12s`), and safe non-JSON response handling.
- **Storage Reads (`src/state/storage.ts`)**: Guarded with `try/catch` so corrupt JSON or private-browsing storage restrictions never crash render cycles.
- **UI Recovery (`src/components/common/ErrorBoundary.tsx`)**: Wraps the root tree in `src/main.tsx` to catch unexpected component runtime errors.
