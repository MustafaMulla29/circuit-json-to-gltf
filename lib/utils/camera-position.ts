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

  // Position camera for isometric/oblique view - similar to the reference image
  // This creates a view where you can see the top and the side/depth of the PCB
  const camX = Math.round(baseDistance * 0.7 * 100) / 100 // Round to 2 decimal places
  const camY = Math.round(baseDistance * 1.2 * 100) / 100
  const camZ = Math.round(baseDistance * 0.8 * 100) / 100

  return {
    camPos: [camX, camY, camZ] as const,
    lookAt: [
      Math.round(center.x * 100) / 100,
      Math.round(center.y * 100) / 100,
      0,
    ] as const,
  }
}
