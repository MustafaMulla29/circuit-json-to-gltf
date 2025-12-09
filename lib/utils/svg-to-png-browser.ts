import type { ResvgRenderOptions } from "@resvg/resvg-js"
import tscircuitFont from "../assets/tscircuit-font"

// Don't use static imports for WASM modules - they fail when externalized
let Resvg: any
let initWasm: any
let wasmInitialized = false

async function loadWasmModule() {
  if (Resvg && initWasm) return true

  try {
    // Try to dynamically import the module
    const wasmModule = await import("@resvg/resvg-wasm")
    Resvg = wasmModule.Resvg
    initWasm = wasmModule.initWasm

    if (!initWasm) {
      throw new Error("initWasm function not found in @resvg/resvg-wasm module")
    }

    return true
  } catch (error) {
    console.error("Failed to load @resvg/resvg-wasm module:", error)
    throw new Error(
      `WASM module could not be loaded. GLB export requires @resvg/resvg-wasm but it failed to load. ` +
        `This may happen if the module was externalized by the bundler. ` +
        `Error: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

async function ensureWasmInitialized() {
  if (wasmInitialized) return

  // First, load the module
  await loadWasmModule()

  try {
    // Check if we're in a Node.js/Bun environment
    if (typeof process !== "undefined" && process.versions?.node) {
      // Dynamically import Node.js modules only in Node.js environment
      const { readFileSync } = await import("fs")
      const { dirname, join } = await import("path")

      // Try to resolve the WASM file path relative to the package
      try {
        const packagePath = require.resolve("@resvg/resvg-wasm/package.json")
        const wasmPath = join(dirname(packagePath), "index_bg.wasm")
        const wasmBuffer = readFileSync(wasmPath)
        await initWasm(wasmBuffer)
      } catch (pathError) {
        // Fallback: try relative to the module's main file
        try {
          const modulePath = require.resolve("@resvg/resvg-wasm")
          const wasmPath = join(dirname(modulePath), "index_bg.wasm")
          const wasmBuffer = readFileSync(wasmPath)
          await initWasm(wasmBuffer)
        } catch (fallbackError) {
          throw new Error(
            `Failed to locate WASM file: ${(pathError as Error).message}, ${(fallbackError as Error).message}`,
          )
        }
      }
    } else {
      // Browser environment - load from CDN
      try {
        // Try primary CDN
        const response = await fetch(
          "https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm",
        )
        if (!response.ok) {
          throw new Error(
            `CDN fetch failed: ${response.status} ${response.statusText}`,
          )
        }
        await initWasm(response)
      } catch (cdnError) {
        // Fallback to alternative CDN
        console.warn("Primary CDN failed, trying fallback:", cdnError)
        const response = await fetch(
          "https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@2.6.2/index_bg.wasm",
        )
        if (!response.ok) {
          throw new Error(`Fallback CDN also failed: ${response.status}`)
        }
        await initWasm(response)
      }
    }
    wasmInitialized = true
  } catch (error) {
    console.error("Failed to initialize WASM:", error)
    throw new Error(
      `WASM initialization failed: ${error instanceof Error ? error.message : String(error)}. ` +
        `GLB export requires WASM support but initialization failed.`,
    )
  }
}

export interface SvgToPngOptions {
  width?: number
  height?: number
  background?: string
  fonts?: string[]
}

export async function svgToPng(
  svgString: string,
  options: SvgToPngOptions = {},
): Promise<Uint8Array> {
  await ensureWasmInitialized()

  // Decode the base64-encoded font to Uint8Array
  const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }

  const fontBuffer = base64ToUint8Array(tscircuitFont)

  // Note: fontBuffers is supported by resvg-wasm but not in the base types
  const opts: ResvgRenderOptions & {
    font?: {
      fontBuffers?: Uint8Array[]
      loadSystemFonts?: boolean
      sansSerifFamily?: string
    }
  } = {
    background: options.background,
    font: {
      loadSystemFonts: false,
      fontBuffers: [fontBuffer],
      defaultFontFamily: "TscircuitAlphabet",
      monospaceFamily: "TscircuitAlphabet",
      sansSerifFamily: "TscircuitAlphabet",
    },
    fitTo: options.width
      ? {
          mode: "width" as const,
          value: options.width,
        }
      : options.height
        ? {
            mode: "height" as const,
            value: options.height,
          }
        : undefined,
  }

  const resvg = new Resvg(svgString, opts)
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  return pngBuffer
}

export async function svgToPngDataUrl(
  svgString: string,
  options: SvgToPngOptions = {},
): Promise<string> {
  const pngBuffer = await svgToPng(svgString, options)

  // Convert Uint8Array to base64
  let binary = ""
  const bytes = new Uint8Array(pngBuffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  const base64 = btoa(binary)

  return `data:image/png;base64,${base64}`
}
