import { test, expect } from "bun:test"
import { Circuit } from "tscircuit"
import { convertCircuitJsonToGltf } from "../../lib"
import { getBestCameraPosition } from "../../lib/utils/camera-position"
import { renderGLTFToPNGBufferFromGLBBuffer } from "poppygl"

test("board-with-pcbX-and-pcbY-offset-snapshot", async () => {
  const circuit = new Circuit()
  
  circuit.add(
    <board width="30mm" height="20mm" pcbX={5} pcbY={-3}>
      <resistor
        name="R1"
        resistance="10kohm"
        footprint="0805"
        pcbX={-10}
        pcbY={-5}
      />
      <resistor
        name="R2"
        resistance="10kohm"
        footprint="0805"
        pcbX={10}
        pcbY={5}
      />
      <resistor
        name="R3"
        resistance="10kohm"
        footprint="0805"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  const circuitJson = circuit.getCircuitJson()

  // Use fixed camera position to see the actual board offset
  const camPos = [25, 30, 25] as const
  const lookAt = [0, 0, 0] as const

  const glbBuffer = (await convertCircuitJsonToGltf(circuitJson, {
    format: "glb",
    boardTextureResolution: 512,
  })) as ArrayBuffer

  const pngBuffer = await renderGLTFToPNGBufferFromGLBBuffer(glbBuffer, {
    camPos,
    lookAt,
  })

  expect(pngBuffer).toMatchPngSnapshot(import.meta.path)
})
