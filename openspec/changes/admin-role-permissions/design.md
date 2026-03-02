## Context

**Background:**
Proxifeast admin dashboard currently grants all authenticated admin users full access to all features regardless of their job role. This creates security and operational issues:

- Kitchen staff can access billing/subscription settings
- Waiters can modify menu items
- No tablet-optimized views for kitchen/waiter workflows
- All restaurants offer all order services by default

**Current State:**

- Users collection has `restaurantIds` and `adminRestaurantIds` arrays
- Admin layout checks `isAdminForRestaurant` but no role distinction
- All order types (table, pickup, delivery) always enabled
- No role-based routing or UI filtering

**Constraints:**

- Must work with existing PocketBase backend
- Must maintain backward compatibility with existing admin users (default to "owner" role)
- Phase 1: No offline caching (Phase 3)

## Goals / Non-Goals

**Goals:**

1. Add role-based access control to admin users
2. Restrict admin routes/UI based on role
3. Allow restaurants to toggle order services they offer
4. Add tablet/kitchen mode for order management

**Non-Goals:**

- Offline-first capabilities (Phase 2/3)
- Printer integration (Phase 3)
- Multi-restaurant staff assignment (beyond scope)

## Decisions

### 1. Role Storage: Field in Users Collection

**Decision:** Add `role` field directly to users collection
**Rationale:** Aligns with existing pattern (`adminRestaurantIds`), simple to query, no additional collection needed
**Alternative:** Separate staff collection - adds complexity, more queries

### 2. Default Role: "owner" for existing admins

**Decision:** Existing users without role default to "owner"
**Rationale:** Backward compatibility, no migration needed, existing admins keep full access
**Alternative:** Default to lowest role - would break existing workflows

### 3. Role Routing: Server-side guards in +layout.server.ts

**Decision:** Implement guards in layout server load
**Rationale:** Prevents unauthorized access at route level, works with existing auth pattern
**Alternative:** Client-side only - less secure, users could access restricted routes

### 4. Order Services: JSON field on restaurants

**Decision:** Single JSON field `orderServices: { tableService, pickup, homeDelivery }`
**Rationale:** Flexible, easy to extend, matches PocketBase schema
**Alternative:** Separate boolean fields - less flexible

### 5. Tablet Mode: Query Parameters

**Decision:** Use `?kitchen=true` and `?waiter=true` query params
**Rationale:** No new routes needed, easy to share/bookmark, works with existing layout

## Risks / Trade-offs

| Risk                                    | Mitigation                                      |
| --------------------------------------- | ----------------------------------------------- |
| Users without role field get locked out | Default to "owner" role if field missing        |
| Role field not synced to client         | Include role in user object from hooks          |
| Super admin role complexity             | Super admins always get "owner" role equivalent |
| Order services default behavior         | Default all to true for backward compatibility  |

## Implementation Sequence

1. **Backend (PocketBase)**

   - Add `role` field to users collection (select: owner, manager, kitchen, waiter)
   - Add `orderServices` field to restaurants collection (JSON)

2. **Frontend - Auth**

   - Update hooks.server.ts to pass role in user object

3. **Frontend - Guards**

   - Add role-based redirect logic in admin +layout.server.ts

4. **Frontend - UI**

   - Filter admin sidebar by role
   - Add role checks to action buttons

5. **Frontend - Order Services**

   - Add service toggles in restaurant settings
   - Filter customer UI by enabled services

6. **Frontend - Tablet Mode**
   - Add kitchen/waiter query param handling
   - Create optimized layouts for tablet view
