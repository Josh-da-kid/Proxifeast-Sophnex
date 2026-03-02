## Why

Currently, all admin users have full access to all admin features regardless of their actual role in the restaurant. This creates security and usability issues: kitchen staff can access billing/subscriptions, waiters can modify menus, and there's no way to restrict access based on job function. Additionally, restaurants cannot control which order services (table, pickup, delivery) they offer - all are enabled by default.

## What Changes

1. **Role-Based Access Control**

   - Add `role` field to PocketBase users collection (owner/manager/kitchen/waiter)
   - Implement role-based routing guards in admin layout
   - Filter admin sidebar navigation by role
   - Hide restricted actions (setup, billing, analytics) for kitchen/waiter roles

2. **Order Services Selection**

   - Add `orderServices` field to restaurants collection (tableService, pickup, homeDelivery)
   - Admin UI to toggle which services the restaurant offers
   - Customer-facing UI shows only enabled services

3. **Admin Order Page Improvements**
   - Role-based visibility: Kitchen sees pending/preparing, Waiter sees ready/delivered
   - Tablet/kitchen mode query params (?kitchen=true, ?waiter=true) for fullscreen layouts
   - Color-coded status badges

## Capabilities

### New Capabilities

- **admin-role-access**: Role-based access control for admin users (owner/manager/kitchen/waiter)
- **order-services-toggle**: Restaurant can enable/disable order service types
- **tablet-kitchen-mode**: Tablet-optimized kitchen/waiter order view

### Modified Capabilities

- None - this is a new feature not modifying existing requirements

## Impact

- **Backend**: Add fields to `users` and `restaurants` collections in PocketBase
- **Frontend**: Update admin layout, sidebar, routing guards
- **Database**: New fields don't affect existing data
