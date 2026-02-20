## MODIFIED Requirements

### Requirement: Selection mode as intermediate state
The system SHALL introduce a "selection mode" state between idle and draft mode.

#### Scenario: Selection mode activation
- **GIVEN** the system is in idle state
- **WHEN** the player clicks on an existing character cell
- **THEN** the system SHALL enter selection mode
- **AND** `gameState.selectionMode` SHALL be set to true
- **AND** `gameState.selectedSource` SHALL store the clicked cell coordinates and character

#### Scenario: Selection mode to draft mode transition
- **GIVEN** the system is in selection mode
- **WHEN** the player clicks a highlighted empty cell
- **THEN** the system SHALL exit selection mode
- **AND** the system SHALL enter draft mode
- **AND** the selected empty cell SHALL become the draft anchor

#### Scenario: Selection mode cancellation via empty click
- **GIVEN** the system is in selection mode
- **WHEN** the player clicks on a non-highlighted empty area
- **THEN** the system SHALL exit selection mode
- **AND** all highlights SHALL be cleared
- **AND** the system SHALL return to idle state

#### Scenario: Selection mode cancellation via ESC key
- **GIVEN** the system is in selection mode
- **WHEN** the player presses the Escape key
- **THEN** the system SHALL exit selection mode
- **AND** the system SHALL return to idle state

### Requirement: Updated state machine
The system SHALL implement the following state transitions:

#### Scenario: Idle to selection transition
- **GIVEN** the system is in idle state
- **WHEN** the player clicks an existing character
- **THEN** the system SHALL transition to selection mode

#### Scenario: Idle to draft blocked without selection
- **GIVEN** the system is in idle state
- **WHEN** the player attempts to enter draft mode without selection
- **THEN** the system SHALL remain in idle state
- **AND** no draft bar SHALL appear

#### Scenario: Selection to idle on drag start
- **GIVEN** the system is in selection mode
- **WHEN** the player starts dragging the canvas
- **THEN** the system SHALL exit selection mode
- **AND** the system SHALL return to idle state
- **AND** highlights SHALL be cleared

### Requirement: Updated input event handling
The system SHALL modify input event handlers to support the new flow.

#### Scenario: HandleClick updated for selection mode
- **GIVEN** the system is in idle state
- **WHEN** the player clicks on a character cell
- **THEN** the system SHALL detect the cell under cursor
- **AND** if the cell contains a character, enter selection mode

#### Scenario: HandleClick in selection mode
- **GIVEN** the system is in selection mode
- **WHEN** the player clicks
- **THEN** the system SHALL check if the click is on a highlighted cell
- **AND** if yes, enter draft mode with that cell as anchor
- **AND** if no, exit selection mode and return to idle

#### Scenario: HandleMouseMove in selection mode
- **GIVEN** the system is in selection mode
- **WHEN** the mouse moves
- **THEN** the cursor SHALL change to pointer when over highlighted cells
- **AND** the cursor SHALL remain default when over non-highlighted areas
