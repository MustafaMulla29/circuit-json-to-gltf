import { test, expect } from "bun:test"
import { renderGLTFToPNGBufferFromGLBBuffer } from "poppygl"
import { convertCircuitJsonToGltf } from "../../lib/index"
import { getBestCameraPosition } from "../../lib/utils/camera-position"
import type { CircuitJson } from "circuit-json"
import * as fs from "node:fs"
import * as path from "node:path"

test("usb-c-flashlight-pcb-snapshot", async () => {
  const usbcFlashlightPath = path.join(
    __dirname,
    "../../site/assets/usb-c-flashlight.json",
  )

  const circuitData = fs.readFileSync(usbcFlashlightPath, "utf-8")
  const circuitJson: CircuitJson = JSON.parse(circuitData)

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

  // Render the GLB to PNG with camera position derived from circuit dimensions
  const cameraOptions = getBestCameraPosition(circuitJson)

  // Debug logging to understand differences between local and CI
  console.log("🔍 Debug info:")
  console.log(
    "   Circuit JSON board count:",
    circuitJson.filter((item) => item.type === "pcb_board").length,
  )
  console.log("   Camera options:", cameraOptions)
  console.log("   GLB buffer size:", (glbResult as ArrayBuffer).byteLength)

  expect(
    renderGLTFToPNGBufferFromGLBBuffer(glbResult as ArrayBuffer, cameraOptions),
  ).toMatchPngSnapshot(import.meta.path, "usb-c-flashlight")
})
