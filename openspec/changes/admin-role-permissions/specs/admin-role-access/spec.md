## ADDED Requirements

### Requirement: Role-based admin authentication

The system SHALL support role-based access control for admin users with four roles: owner, manager, kitchen, and waiter.

#### Scenario: User logs in with owner role

- **WHEN** admin user with role "owner" logs in
- **THEN** user SHALL have full access to all admin routes and features

#### Scenario: User logs in with manager role

- **WHEN** admin user with role "manager" logs in
- **THEN** user SHALL have full access to all admin routes and features

#### Scenario: User logs in with kitchen role

- **WHEN** admin user with role "kitchen" logs in
- **THEN** user SHALL be restricted to /admin/admin-order, /admin/menu, /admin/today-menu routes
- **AND** user SHALL NOT see billing, analytics, setup, or statistics navigation

#### Scenario: User logs in with waiter role

- **WHEN** admin user with role "waiter" logs in
- **THEN** user SHALL be restricted to /admin/admin-order, /admin/menu routes
- **AND** user SHALL NOT see billing, analytics, setup, statistics, or today-menu navigation

### Requirement: Role stored in user session

The system SHALL include the user's role in the authenticated session data.

#### Scenario: Role available in server load

- **WHEN** authenticated user requests any admin page
- **THEN** the role SHALL be available in locals.user.role server-side

#### Scenario: Role defaults to owner for legacy users

- **WHEN** admin user without a role field logs in
- **THEN** the system SHALL treat the user as "owner" for backward compatibility

### Requirement: Role-based route protection

The system SHALL prevent unauthorized access to admin routes based on user role.

#### Scenario: Kitchen user accesses billing page

- **WHEN** user with role "kitchen" navigates to /admin/billing
- **THEN** system SHALL redirect user to /admin/admin-order

#### Scenario: Waiter user accesses analytics page

- **WHEN** user with role "waiter" navigates to /admin/analytics
- **THEN** system SHALL redirect user to /admin/admin-order

### Requirement: Role-based UI rendering

The system SHALL hide restricted UI elements based on user role.

#### Scenario: Owner sees all admin navigation

- **WHEN** user with role "owner" views admin sidebar
- **THEN** all navigation items SHALL be visible including Setup, Billing, Analytics

#### Scenario: Kitchen user sees limited navigation

- **WHEN** user with role "kitchen" views admin sidebar
- **THEN** only Orders, Menu, and Today's Menu navigation SHALL be visible
