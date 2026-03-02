## ADDED Requirements

### Requirement: Tablet/kitchen mode activation

The system SHALL support tablet-optimized views for kitchen and waiter workflows via query parameters.

#### Scenario: Kitchen mode activated

- **WHEN** user visits /admin/admin-order?kitchen=true
- **THEN** the page SHALL render in fullscreen tablet layout
- **AND** sidebar SHALL be hidden
- **AND** font sizes SHALL be larger for readability

#### Scenario: Waiter mode activated

- **WHEN** user visits /admin/admin-order?waiter=true
- **THEN** the page SHALL render in fullscreen tablet layout
- **AND** sidebar SHALL be hidden

### Requirement: Kitchen order view

The system SHALL show kitchen-appropriate order information.

#### Scenario: Kitchen sees pending and preparing orders

- **WHEN** kitchen user views /admin/admin-order
- **THEN** orders with status "pending" and "preparing" SHALL be prominently displayed
- **AND** orders with status "ready" and "delivered" SHALL be less prominent or hidden

#### Scenario: Kitchen marks order as preparing

- **WHEN** kitchen user clicks "Start Preparing" on pending order
- **THEN** order status SHALL change from "pending" to "preparing"

#### Scenario: Kitchen marks order as ready

- **WHEN** kitchen user clicks "Mark Ready" on preparing order
- **THEN** order status SHALL change from "preparing" to "ready"

### Requirement: Waiter order view

The system SHALL show waiter-appropriate order information.

#### Scenario: Waiter sees ready and delivered orders

- **WHEN** waiter user views /admin/admin-order
- **THEN** orders with status "ready" and "delivered" SHALL be prominently displayed
- **AND** pending orders SHALL be hidden or minimized

#### Scenario: Waiter marks order as delivered

- **WHEN** waiter user clicks "Delivered" on ready order
- **THEN** order status SHALL change from "ready" to "delivered"

### Requirement: Color-coded status badges

The system SHALL display order status with distinct colors.

#### Scenario: Status badge colors

- **WHEN** order has status "pending"
- **THEN** badge SHALL be yellow/orange colored
- **AND** "preparing" SHALL be blue
- **AND** "ready" SHALL be green
- **AND** "delivered" SHALL be gray
