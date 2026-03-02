## 1. Backend - PocketBase Schema

- [ ] 1.1 Add `role` field to users collection (select: owner, manager, kitchen, waiter)
- [ ] 1.2 Add `orderServices` field to restaurants collection (JSON: { tableService: true, pickup: true, homeDelivery: true })

## 2. Frontend - Auth & Guards

- [ ] 2.1 Update hooks.server.ts to include role in user object
- [ ] 2.2 Update admin +layout.server.ts to add role-based route guards
- [ ] 2.3 Add redirect logic for unauthorized role access

## 3. Frontend - Admin Navigation

- [ ] 3.1 Read current user role in Nav.svelte
- [ ] 3.2 Filter sidebar items based on user role
- [ ] 3.3 Hide Setup, Billing, Analytics for kitchen/waiter roles

## 4. Frontend - Order Services Toggle

- [ ] 4.1 Create restaurant settings component for order services
- [ ] 4.2 Add toggle switches for tableService, pickup, homeDelivery
- [ ] 4.3 Save order services to PocketBase
- [ ] 4.4 Update customer UI to show only enabled services

## 5. Frontend - Tablet/Kitchen Mode

- [ ] 5.1 Add query param handling (?kitchen=true, ?waiter=true) in admin-order page
- [ ] 5.2 Create tablet-optimized layout (hide sidebar, larger fonts)
- [ ] 5.3 Add color-coded status badges to order cards
- [ ] 5.4 Implement role-based order filtering in admin-order page

## 6. Testing & Verification

- [ ] 6.1 Test owner role has full access
- [ ] 6.2 Test manager role has full access
- [ ] 6.3 Test kitchen role is restricted to allowed routes
- [ ] 6.4 Test waiter role is restricted to allowed routes
- [ ] 6.5 Test order services toggle updates customer view
- [ ] 6.6 Test kitchen mode query param activates tablet layout
- [ ] 6.7 Test waiter mode query param activates tablet layout
