import { test, expect } from "bun:test"
import { renderGLTFToPNGBufferFromGLBBuffer } from "poppygl"
import { convertCircuitJsonToGltf } from "../../lib/index"
import type { CircuitJson } from "circuit-json"

// Import PNG matcher to make it available
import "../fixtures/png-matcher"

test("simple-circuit-pcb-snapshot", async () => {
  // Load the simple circuit fixture
  const simpleCircuit: CircuitJson = [
    {
      type: "pcb_board",
      pcb_board_id: "board1",
      center: { x: 0, y: 0 },
      width: 50,
      height: 30,
      thickness: 1.6,
    },
    {
      type: "pcb_component",
      pcb_component_id: "comp1",
      source_component_id: "src1",
      center: { x: -10, y: 0 },
      width: 8,
      height: 6,
      layer: "top",
    },
    {
      type: "pcb_component",
      pcb_component_id: "comp2",
      source_component_id: "src2",
      center: { x: 10, y: 0 },
      width: 10,
      height: 10,
      layer: "top",
    },
    {
      type: "source_component",
      source_component_id: "src1",
      name: "R1",
      display_value: "10k",
    },
    {
      type: "source_component",
      source_component_id: "src2",
      name: "U1",
      display_value: "ATMEGA328",
    },
  ]

  // Convert circuit to GLTF (GLB format for rendering)
  const glbResult = await convertCircuitJsonToGltf(simpleCircuit, {
    format: "glb",
    boardTextureResolution: 512,
    includeModels: true,
    showBoundingBoxes: false,
  })

  // Ensure we got a valid GLB buffer
  expect(glbResult).toBeInstanceOf(ArrayBuffer)
  expect((glbResult as ArrayBuffer).byteLength).toBeGreaterThan(0)

  // Render the GLB to PNG and compare with snapshot
  expect(
    renderGLTFToPNGBufferFromGLBBuffer(glbResult as ArrayBuffer),
  ).toMatchPngSnapshot(import.meta.path)
})

test("usb-c-flashlight-pcb-snapshot", async () => {
  // Load the USB-C flashlight circuit from the site assets
  const usbcFlashlightPath =
    "/workspaces/circuit-json-to-gltf/site/assets/usb-c-flashlight.json"

  let circuitJson: CircuitJson
  try {
    const fs = await import("node:fs")
    const circuitData = fs.readFileSync(usbcFlashlightPath, "utf-8")
    circuitJson = JSON.parse(circuitData)
  } catch (error) {
    // If the file doesn't exist, skip this test
    console.warn("USB-C flashlight circuit file not found, skipping test")
    return
  }

  // Convert circuit to GLTF (GLB format for rendering)
  const glbResult = await convertCircuitJsonToGltf(circuitJson, {
    format: "glb",
    boardTextureResolution: 1024,
    includeModels: true,
    showBoundingBoxes: false,
  })

  // Ensure we got a valid GLB buffer
  expect(glbResult).toBeInstanceOf(ArrayBuffer)
  expect((glbResult as ArrayBuffer).byteLength).toBeGreaterThan(0)

  // Render the GLB to PNG and compare with snapshot
  expect(
    renderGLTFToPNGBufferFromGLBBuffer(glbResult as ArrayBuffer),
  ).toMatchPngSnapshot(import.meta.path, "usb-c-flashlight")
})
