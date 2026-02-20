## ADDED Requirements

### Requirement: Validation occurs after text input is complete
The system SHALL perform game rule validation only after the player has completed entering the poem text and clicked submit.

#### Scenario: Validation triggers on submit
- **GIVEN** the player is in draft mode
- **AND** the player has entered text in the draft input field
- **WHEN** the player clicks the submit button
- **THEN** the system SHALL validate the entered text against game rules

#### Scenario: Valid poem passes validation
- **GIVEN** the player submits a poem that shares at least one matching character with an existing poem
- **AND** there are no character conflicts
- **AND** the poem contains at least one new character
- **WHEN** validation runs
- **THEN** the poem SHALL be accepted and added to the grid

#### Scenario: Invalid poem shows error message
- **GIVEN** the player submits a poem with no matching characters
- **WHEN** validation runs
- **THEN** the system SHALL display an error message explaining the rule violation
- **AND** the draft mode SHALL remain active for the player to correct the input

#### Scenario: Character conflict detection
- **GIVEN** the player submits a poem that overlaps with existing characters
- **AND** at least one overlapping position has different characters
- **WHEN** validation runs
- **THEN** the system SHALL display an error indicating the conflict location
- **AND** conflicting characters SHALL be visually highlighted in red

### Requirement: Error display in draft bar
The system SHALL display validation errors within the draft input bar interface.

#### Scenario: Error message display
- **WHEN** validation fails
- **THEN** an error message SHALL appear below the text input field
- **AND** the message text SHALL be colored red
- **AND** the message SHALL persist until the user modifies the input or cancels

#### Scenario: Visual feedback for overlapping area
- **WHEN** validation detects character conflicts
- **THEN** the conflicting cells in the grid preview SHALL be highlighted with red background
- **AND** matching characters SHALL continue to be highlighted in green
