## ADDED Requirements

### Requirement: Restaurant order services configuration

The system SHALL allow restaurant admins to configure which order services they offer.

#### Scenario: Admin enables only table service

- **WHEN** restaurant admin toggles tableService ON and pickup, homeDelivery OFF
- **AND** saves settings
- **THEN** the restaurant SHALL only offer table ordering

#### Scenario: Admin enables pickup and delivery

- **WHEN** restaurant admin toggles pickup ON, homeDelivery ON, tableService OFF
- **AND** saves settings
- **THEN** the restaurant SHALL offer only pickup and home delivery

#### Scenario: All services enabled by default

- **WHEN** restaurant record has no orderServices field
- **THEN** all three services SHALL default to enabled for backward compatibility

### Requirement: Customer sees only enabled services

The system SHALL display only the order services that the restaurant has enabled.

#### Scenario: Customer views restaurant with table service only

- **WHEN** customer visits restaurant with only tableService enabled
- **THEN** customer SHALL only see "Order at Table" option
- **AND** pickup and delivery options SHALL NOT be visible

#### Scenario: Customer views restaurant with all services

- **WHEN** customer visits restaurant with all services enabled
- **THEN** customer SHALL see all three options: Table Service, Pickup, Home Delivery

### Requirement: Order service stored in restaurant record

The system SHALL store order service configuration in the restaurant collection.

#### Scenario: Services saved to database

- **WHEN** admin saves order service settings
- **THEN** settings SHALL be persisted in restaurant.orderServices JSON field
