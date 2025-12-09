import type { ResvgRenderOptions } from "@resvg/resvg-js"
import tscircuitFont from "../assets/tscircuit-font"

let wasmInitialized = false
let ResvgClass: typeof import("@resvg/resvg-wasm").Resvg | null = null

const CDN_BASE = "https://esm.sh/@resvg/resvg-wasm@2.6.2"
const WASM_CDN_URL = "https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm"

async function loadResvgFromCDN() {
  // Use Function constructor to bypass both TS and bundler
  const dynamicImport = new Function("url", "return import(url)")
  const module = await dynamicImport(CDN_BASE)
  return module
}

async function ensureWasmInitialized() {
  if (!wasmInitialized) {
    try {
      // Check if we're in a Node.js/Bun environment
      if (typeof process !== "undefined" && process.versions?.node) {
        // Dynamically import Node.js modules only in Node.js environment
        const { readFileSync } = await import("fs")
        const { dirname, join } = await import("path")

        // Try to import the module first
        let resvgModule: typeof import("@resvg/resvg-wasm")
        try {
          resvgModule = await import("@resvg/resvg-wasm")
        } catch {
          // If bundled import fails, try CDN
          resvgModule = await loadResvgFromCDN()
        }

        const { Resvg, initWasm } = resvgModule
        ResvgClass = Resvg

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
        // Browser environment - try dynamic import first, then fall back to CDN
        let resvgModule: typeof import("@resvg/resvg-wasm")

        try {
          // Try the bundled import first (works when not externalized)
          resvgModule = await import("@resvg/resvg-wasm")
          // Verify the module was actually loaded (not just an empty externalized stub)
          if (!resvgModule.initWasm || !resvgModule.Resvg) {
            throw new Error("Module externalized, falling back to CDN")
          }
        } catch {
          // Fallback to CDN when module is externalized or import fails
          resvgModule = await loadResvgFromCDN()
        }

        const { Resvg, initWasm } = resvgModule
        ResvgClass = Resvg

        // Initialize WASM from CDN
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - Vite will handle this import
          const wasmUrl = await import("@resvg/resvg-wasm/index_bg.wasm?url")
          await initWasm(fetch(wasmUrl.default))
        } catch {
          // Fallback to CDN for WASM binary
          await initWasm(fetch(WASM_CDN_URL))
        }
      }
      wasmInitialized = true
    } catch (error) {
      console.error("Failed to initialize WASM:", error)
      throw error
    }
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

  if (!ResvgClass) {
    throw new Error("Resvg not initialized. Call ensureWasmInitialized first.")
  }
  const resvg = new ResvgClass(svgString, opts)
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
