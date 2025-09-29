import { test, expect } from "bun:test"
import { renderGLTFToPNGBufferFromGLBBuffer } from "poppygl"
import { convertCircuitJsonToGltf } from "../../lib/index"
import type { CircuitJson } from "circuit-json"

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

  // Render the GLB to PNG with better camera position for PCB viewing
  const renderOptions = {
    camPos: [25, 25, 20] as const,
  }

  expect(
    renderGLTFToPNGBufferFromGLBBuffer(glbResult as ArrayBuffer, renderOptions),
  ).toMatchPngSnapshot(import.meta.path)
})
