# PCB Board Center Positioning - Implementation Summary

## Overview
Added support for `pcbX` and `pcbY` properties on the `pcb_board` element to enable board positioning/offset in 3D space. This allows boards to be positioned relative to their center point, with all components moving with the board.

## Changes Made

### 1. Core Implementation Files

#### `lib/converters/circuit-to-3d.ts`
- Added board offset calculation from `pcbX` and `pcbY` properties (defaults to 0)
- Applied offset to board positioning
- Applied offset to all component positions (both with and without 3D models)
- Adjusted camera target to follow the offset board center

#### `lib/browser.ts`
- Applied the same offset logic for browser-based rendering
- Ensures consistency between Node.js and browser environments

### 2. Tests

Created three snapshot tests (one per file) to verify visual output:

#### `tests/snapshot/board-with-offset.test.tsx`
- Tests board with both `pcbX={5}` and `pcbY={-3}` offset
- Includes three resistors to visualize positioning
- Generates PNG snapshot for visual verification

#### `tests/snapshot/board-without-offset.test.tsx`
- Tests default behavior (no offset properties)
- Same component layout as offset test for comparison
- Verifies backward compatibility

#### `tests/snapshot/board-with-pcbX-only.test.tsx`
- Tests partial offset with only `pcbX={10}`
- Verifies that missing `pcbY` defaults to 0

All snapshot tests:
- Use real Circuit components (resistors with 0805 footprint)
- Generate 3D renders with proper camera positioning
- Verify visual output matches expected results

### 3. Documentation

#### `docs/board-center-positioning.md`
- Comprehensive feature documentation
- Usage examples
- Implementation details
- Use cases

#### `README.md`
- Added feature to features list with link to detailed docs

### 4. Example

#### `examples/board-center-offset.ts`
- Runnable example demonstrating the feature
- Generates two GLB files for comparison:
  - `board-with-offset-example.glb` - Board with offset
  - `board-no-offset-example.glb` - Board without offset

## How It Works

1. **Board Offset Extraction**: Extract `pcbX` and `pcbY` from the board object (defaults to 0 if not present)

2. **Board Positioning**: Add offset to board center position when creating the board box:
   ```typescript
   x: pcbBoard.center.x + boardOffsetX
   z: pcbBoard.center.y + boardOffsetY
   ```

3. **Component Positioning**: Add the same offset to all component positions so they move with the board

4. **Camera Adjustment**: Adjust camera target to look at the offset board center

## Coordinate System

- `pcbX` maps to X-axis in 3D space (horizontal)
- `pcbY` maps to Z-axis in 3D space (depth/forward-backward)
- Y-axis represents vertical position (height above/below board)

## Use Cases

1. **Relative Positioning in Groups**: Position boards within group hierarchies (matching the behavior shown in the attachment image)
2. **Multi-board Assemblies**: Position multiple boards in a single 3D scene
3. **Layout Adjustments**: Fine-tune positioning without modifying component coordinates
4. **Scene Composition**: Arrange multiple PCBs in larger assemblies

## Testing

All tests pass:
- 3 new snapshot tests for board offset feature (one per file):
  - `board-with-offset.test.tsx` - Full offset test
  - `board-without-offset.test.tsx` - Default behavior
  - `board-with-pcbX-only.test.tsx` - Partial offset
- All existing tests continue to pass (29 total tests)
- Example generates valid GLB files
- Snapshot images generated in `tests/snapshot/__snapshots__/`

## Backward Compatibility

- Feature is fully backward compatible
- Boards without `pcbX` or `pcbY` properties default to 0 offset
- No changes required to existing circuit JSON files
- Existing functionality remains unchanged

## Related to Issue

This implementation addresses the feature request for PCB board center positioning, similar to how groups can be positioned with `pcbX` and `pcbY` properties (as shown in the attachment image).
