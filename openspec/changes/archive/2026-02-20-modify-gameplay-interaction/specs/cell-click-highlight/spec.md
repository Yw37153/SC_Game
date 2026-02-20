## ADDED Requirements

### Requirement: Clicking an existing cell highlights adjacent empty cells
The system SHALL highlight all adjacent empty cells (up, down, left, right) when a player clicks on an existing character cell.

#### Scenario: Clicking a character with all adjacent cells empty
- **GIVEN** a character exists at grid position (0, 0)
- **WHEN** the player clicks on that character cell
- **THEN** the system highlights empty cells at positions (0, -1), (0, 1), (-1, 0), and (1, 0)

#### Scenario: Clicking a character with some occupied adjacent cells
- **GIVEN** a character exists at grid position (0, 0)
- **AND** there is another character at position (0, 1)
- **WHEN** the player clicks on the character at (0, 0)
- **THEN** the system highlights only the empty cells at (0, -1), (-1, 0), and (1, 0)
- **AND** the occupied cell at (0, 1) is NOT highlighted

#### Scenario: Clicking a highlighted empty cell enters draft mode
- **GIVEN** the player has clicked a character and adjacent cells are highlighted
- **WHEN** the player clicks on one of the highlighted empty cells
- **THEN** the system enters draft mode with that cell as the starting position

#### Scenario: Clicking empty space cancels selection mode
- **GIVEN** the player has clicked a character and cells are highlighted
- **WHEN** the player clicks on a non-highlighted empty area
- **THEN** the system clears the highlights and returns to idle state

### Requirement: Visual feedback for highlighted cells
The system SHALL provide clear visual feedback for highlighted cells.

#### Scenario: Highlight visual style
- **WHEN** cells are highlighted as potential fill positions
- **THEN** they SHALL display with a semi-transparent green background
- **AND** they SHALL display with a green border
- **AND** the cursor SHALL change to a pointer when hovering over highlighted cells

#### Scenario: Highlight dismissal
- **WHEN** the player selects a highlighted cell or cancels selection
- **THEN** all highlights SHALL be immediately cleared
