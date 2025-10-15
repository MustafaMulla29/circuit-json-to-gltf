import { convertCircuitJsonToGltf } from "../lib"
import type { CircuitJson, PcbBoard, PcbComponent } from "circuit-json"
import { writeFileSync } from "fs"

async function main() {
  // Example 1: Board with pcbX and pcbY offset
  const board: PcbBoard & { pcbX?: number; pcbY?: number } = {
    type: "pcb_board",
    pcb_board_id: "board1",
    center: { x: 0, y: 0 },
    width: 30,
    height: 20,
    thickness: 1.6,
    num_layers: 2,
    material: "fr4",
    // Apply offset to position the board
    pcbX: 10,
    pcbY: -5,
  }

  // Add some components to visualize the offset
  const components: PcbComponent[] = [
    {
      type: "pcb_component",
      pcb_component_id: "comp1",
      source_component_id: "src1",
      center: { x: -10, y: -5 },
      width: 5,
      height: 3,
      layer: "top",
      rotation: 0,
      obstructs_within_bounds: false,
    },
    {
      type: "pcb_component",
      pcb_component_id: "comp2",
      source_component_id: "src2",
      center: { x: 10, y: 5 },
      width: 4,
      height: 4,
      layer: "top",
      rotation: 0,
      obstructs_within_bounds: false,
    },
    {
      type: "pcb_component",
      pcb_component_id: "comp3",
      source_component_id: "src3",
      center: { x: 0, y: 0 },
      width: 6,
      height: 2,
      layer: "top",
      rotation: 0,
      obstructs_within_bounds: false,
    },
  ]

  const circuit: CircuitJson = [board, ...components]

  // Convert to GLTF
  const gltfBuffer = await convertCircuitJsonToGltf(circuit, {
    format: "glb",
    boardTextureResolution: 0, // Disable textures
  })

  // Save the GLB file
  writeFileSync("board-with-offset-example.glb", Buffer.from(gltfBuffer as ArrayBuffer))

  console.log("✅ Generated board-with-offset-example.glb")
  console.log(
    `   Board positioned at (${board.pcbX}, ${board.pcbY}) with components`,
  )

  // Example 2: Board without offset (for comparison)
  const boardNoOffset: PcbBoard = {
    type: "pcb_board",
    pcb_board_id: "board2",
    center: { x: 0, y: 0 },
    width: 30,
    height: 20,
    thickness: 1.6,
    num_layers: 2,
    material: "fr4",
  }

  const circuit2: CircuitJson = [boardNoOffset, ...components]

  const gltfBuffer2 = await convertCircuitJsonToGltf(circuit2, {
    format: "glb",
    boardTextureResolution: 0, // Disable textures
  })

  writeFileSync("board-no-offset-example.glb", Buffer.from(gltfBuffer2 as ArrayBuffer))

  console.log("✅ Generated board-no-offset-example.glb")
  console.log("   Board positioned at default (0, 0)")
}

main().catch(console.error)
