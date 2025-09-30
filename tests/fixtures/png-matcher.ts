import { expect, type MatcherResult } from "bun:test"
import * as fs from "node:fs"
import * as path from "node:path"
import looksSame from "looks-same"

/**
 * Matcher for PNG snapshot testing.
 *
 * Usage:
 *   expect(pngBuffer).toMatchPngSnapshot(import.meta.path, "optionalName");
 */
async function toMatchPngSnapshot(
  // biome-ignore lint/suspicious/noExplicitAny: bun doesn't expose
  this: any,
  receivedMaybePromise: Buffer | Uint8Array | Promise<Buffer | Uint8Array>,
  testPathOriginal: string,
  pngName?: string,
): Promise<MatcherResult> {
  const received = await receivedMaybePromise
  const testPath = testPathOriginal
    .replace(/\.test\.tsx?$/, "")
    .replace(/\.test\.ts$/, "")
  const snapshotDir = path.join(path.dirname(testPath), "__snapshots__")
  const snapshotName = pngName
    ? `${pngName}.snap.png`
    : `${path.basename(testPath)}.snap.png`
  const filePath = path.join(snapshotDir, snapshotName)

  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true })
  }

  const updateSnapshot =
    process.argv.includes("--update-snapshots") ||
    process.argv.includes("-u") ||
    Boolean(process.env["BUN_UPDATE_SNAPSHOTS"])
  const forceUpdate = Boolean(process.env["FORCE_BUN_UPDATE_SNAPSHOTS"])

  const fileExists = fs.existsSync(filePath)

  if (!fileExists) {
    console.log("Writing PNG snapshot to", filePath)
    fs.writeFileSync(filePath, received)
    return {
      message: () => `PNG snapshot created at ${filePath}`,
      pass: true,
    }
  }

  const existingSnapshot = fs.readFileSync(filePath)

  const result: any = await looksSame(
    Buffer.from(received),
    Buffer.from(existingSnapshot),
    {
      strict: false,
      tolerance: 10, // Much higher tolerance for 3D rendering
      antialiasingTolerance: 5, // Handle anti-aliasing differences
      ignoreAntialiasing: true, // Ignore anti-aliasing completely
      ignoreCaret: true, // Ignore caret if present
    },
  )

  if (updateSnapshot) {
    if (!forceUpdate && result.equal) {
      return {
        message: () => "PNG snapshot matches",
        pass: true,
      }
    }
    console.log("Updating PNG snapshot at", filePath)
    fs.writeFileSync(filePath, received)
    return {
      message: () => `PNG snapshot updated at ${filePath}`,
      pass: true,
    }
  }

  if (result.equal) {
    return {
      message: () => "PNG snapshot matches",
      pass: true,
    }
  }

  const diffPath = filePath.replace(/\.snap\.png$/, ".diff.png")
  await looksSame.createDiff({
    reference: Buffer.from(existingSnapshot),
    current: Buffer.from(received),
    diff: diffPath,
    highlightColor: "#ff00ff",
  })

  console.log(`📸 Snapshot mismatch details:`)
  console.log(`   Expected: ${filePath}`)
  console.log(`   Received: ${received.length} bytes`)
  console.log(`   Expected: ${existingSnapshot.length} bytes`)
  console.log(`   Diff result:`, result)
  console.log(
    `   Diff bounds area: ${(result.diffBounds.right - result.diffBounds.left) * (result.diffBounds.bottom - result.diffBounds.top)} pixels`,
  )
  console.log(`   Diff saved: ${diffPath}`)

  // Let's also check if it's a timestamp or environment-specific rendering issue
  console.log(`   Environment info:`)
  console.log(`     Node version: ${process.version}`)
  console.log(`     Platform: ${process.platform}`)
  console.log(`     Arch: ${process.arch}`)
  console.log(`     CI: ${process.env.CI || "false"}`)

  return {
    message: () => `PNG snapshot does not match. Diff saved at ${diffPath}`,
    pass: false,
  }
}

// Register the matcher globally for Bun's expect
expect.extend({
  toMatchPngSnapshot: toMatchPngSnapshot as any,
})

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchPngSnapshot(
      testPath: string,
      pngName?: string,
    ): Promise<MatcherResult>
  }
}
