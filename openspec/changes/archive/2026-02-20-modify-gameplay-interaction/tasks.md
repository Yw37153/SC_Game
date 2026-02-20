## 1. State Management Updates

- [x] 1.1 Add `selectionMode` and `selectedSource` fields to `gameState` object
- [x] 1.2 Update state reset/cleanup functions to handle selection mode
- [x] 1.3 Add state transition helpers (`enterSelectionMode`, `exitSelectionMode`)

## 2. Highlighting System

- [x] 2.1 Create `getAdjacentEmptyCells(x, y)` function to find valid fill positions
- [x] 2.2 Add `highlightedCells` array to gameState to track current highlights
- [x] 2.3 Implement `drawHighlightedCells()` function in canvas rendering
- [x] 2.4 Add CSS styles for highlighted cell appearance (green background/border)

## 3. Input Flow Modifications

- [x] 3.1 Update `handleMouseMove()` to remove direction arrow hover detection
- [x] 3.2 Modify `handleClick()` to detect character cell clicks and enter selection mode
- [x] 3.3 Update click handler for selection mode to detect highlighted cell clicks
- [x] 3.4 Add ESC key handler to cancel selection mode
- [x] 3.5 Disable canvas drag when in selection mode

## 4. Draft Mode Integration

- [x] 4.1 Modify `enterDraftMode()` to accept anchor position instead of direction
- [x] 4.2 Update direction calculation logic based on source and anchor positions
- [x] 4.3 Remove direction arrow rendering from `drawCanvas()`
- [x] 4.4 Update draft offset calculation for cells in all directions

## 5. Validation System

- [x] 5.1 Move `validateDraft()` call from input handler to submit button handler
- [x] 5.2 Add error message display element in draft bar HTML/CSS
- [x] 5.3 Implement error message rendering in draft mode UI
- [x] 5.4 Update validation visual feedback (red highlight for conflicts)

## 6. Touch Device Support

- [x] 6.1 Update touch input handler for new click flow
- [x] 6.2 Modify virtual button behavior in selection mode (hide arrows, A1 as cancel)
- [x] 6.3 Test touch gestures don't interfere with selection mode

## 7. Testing and Polish

- [x] 7.1 Test clicking characters at grid edges and corners
- [x] 7.2 Test cancellation scenarios (ESC, empty click, drag)
- [x] 7.3 Test validation error display and correction flow
- [x] 7.4 Test backward compatibility with existing saved games
- [x] 7.5 Test on both mouse and touch devices
- [x] 7.6 Verify performance with large poem networks
