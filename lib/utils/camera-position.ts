import type { CircuitJson } from "circuit-json"

/**
 * Calculate optimal camera position for PCB viewing based on circuit dimensions
 */
export function getBestCameraPosition(circuitJson: CircuitJson): {
  camPos: readonly [number, number, number]
  lookAt: readonly [number, number, number]
} {
  // Find PCB board to get dimensions
  const board = circuitJson.find((item) => item.type === "pcb_board")

  if (!board || board.type !== "pcb_board") {
    // Default fallback for circuits without explicit board
    return {
      camPos: [30, 30, 25] as const,
      lookAt: [0, 0, 0] as const,
    }
  }

  const { width, height, center } = board

  // Validate required properties
  if (!width || !height || !center) {
    return {
      camPos: [30, 30, 25] as const,
      lookAt: [0, 0, 0] as const,
    }
  }

  // Calculate camera distance based on board size
  const maxDimension = Math.max(width, height)
  const baseDistance = maxDimension * 0.8

  // This creates a view where you can see the top and the side/depth of the PCB
  const camX = baseDistance * 0.7
  const camY = baseDistance * 1.2
  const camZ = baseDistance * 0.8

  return {
    camPos: [camX, camY, camZ] as const,
    lookAt: [center.x, center.y, 0] as const,
  }
}
