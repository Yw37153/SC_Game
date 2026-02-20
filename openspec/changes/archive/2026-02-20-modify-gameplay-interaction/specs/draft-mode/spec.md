## MODIFIED Requirements

### Requirement: Draft mode triggered by empty cell selection
The system SHALL enter draft mode when a player clicks a highlighted empty cell, not by clicking a direction arrow.

#### Scenario: Entering draft mode via cell selection
- **GIVEN** the player has clicked an existing character
- **AND** adjacent empty cells are highlighted
- **WHEN** the player clicks one of the highlighted cells
- **THEN** the system SHALL enter draft mode
- **AND** the selected cell SHALL become the anchor position for the new poem
- **AND** the draft bar SHALL appear at the bottom of the screen

#### Scenario: Draft mode initialization with direction detection
- **GIVEN** the player selects a highlighted cell at position (1, 0)
- **AND** the source character was at position (0, 0)
- **WHEN** draft mode begins
- **THEN** the system SHALL automatically determine the direction as "H" (horizontal)
- **AND** the draft SHALL extend in the positive X direction

#### Scenario: Draft mode initialization for vertical direction
- **GIVEN** the player selects a highlighted cell at position (0, 1)
- **AND** the source character was at position (0, 0)
- **WHEN** draft mode begins
- **THEN** the system SHALL automatically determine the direction as "V" (vertical)
- **AND** the draft SHALL extend in the positive Y direction

#### Scenario: Draft offset calculation
- **GIVEN** a source character at position (0, 0)
- **WHEN** the player selects a cell at (-1, 0) to the left
- **THEN** the draft anchor SHALL be at (-1, 0)
- **AND** the draft offset SHALL be set to include the source character at position (1, 0)

### Requirement: Removed direction arrow preview
The system SHALL NOT display direction selection arrows when hovering over existing characters.

#### Scenario: No arrows on hover
- **WHEN** the player hovers over an existing character cell
- **THEN** direction arrows SHALL NOT be displayed
- **AND** the cursor SHALL change to pointer to indicate clickability

#### Scenario: Click directly selects source
- **WHEN** the player clicks an existing character
- **THEN** the system SHALL immediately enter "selection mode"
- **AND** adjacent empty cells SHALL be highlighted
- **WITHOUT** requiring any hover state

## REMOVED Requirements

### Requirement: Direction arrow interaction
**Reason**: Replaced by cell click selection mechanism
**Migration**: Players now click on the character first, then select from highlighted adjacent cells
