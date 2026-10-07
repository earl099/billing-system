# User Taste — UI & Data Entry

- For bulk data entry, wants a keyboard-first spreadsheet grid: rows are the natural key (e.g., one row per date), columns are the fields/entry types, and the row label replaces separate key inputs. Confidence: 0.8
- Prefers digit-shorthand input over requiring separators or modifier keys — typing `200` in a time cell should yield `02:00` without pressing `:`, and values should canonicalize to `HH:MM`. Confidence: 0.8
- Expects familiar spreadsheet keyboard conventions in grids: Tab moves between cells, arrow keys move horizontally/vertically, Enter moves down, a dedicated key (e.g., Delete) clears a cell, and a modifier combo (e.g., Ctrl+Enter) saves. Confidence: 0.8
- Dislikes click-heavy entry controls: native `<input type="date">` pickers, a per-row type dropdown, and an "Add" button required for every new row. Confidence: 0.7
- When a new feature replaces an existing UI, keep the old view reachable behind a toggle rather than deleting it, with the new view as the default. Confidence: 0.7
- When asking "what would be the best way to do X?", wants a concrete recommendation plus the lighter alternatives and their trade-offs; then picks one and gives a terse go-ahead (e.g., "implement the grid"). Confidence: 0.7
- Wants data-entry columns in the grid to be driven by the underlying config (only offer OT/ND/field types the destination can actually store), rather than showing every type unconditionally and losing the ones that have no destination. Confidence: 0.7
- For conditions that require user action after the fact (e.g. records that could not be matched), prefers a persistent, dismissible panel with an itemized list over a transient toast that disappears. Confidence: 0.7
