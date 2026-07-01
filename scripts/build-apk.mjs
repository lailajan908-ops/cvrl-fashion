import { writeFileSync, existsSync, mkdirSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { execSync } from "child_process"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

const PWA_URL = "https://cvrl-fashion.vercel.app"
const PACKAGE_NAME = "com.cvrlfashion.store"
const APP_NAME = "CVRL Fashion"
const APK_DIR = path.join(ROOT, "build-apk")
const UNSIGNED_APK = path.join(APK_DIR, "cvrl-fashion-unsigned.apk")
const SIGNED_APK = path.join(ROOT, "cvrl-fashion-signed.apk")
const KEYSTORE = path.join(ROOT, "cvrl-keystore-new.jks")
const BUILD_TOOLS = "C:/Users/latif/AppData/Local/Android/Sdk/build-tools/37.0.0"

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function step(label, fn) {
  process.stdout.write(`${label}... `)
  try {
    await fn()
    console.log("OK")
  } catch (e) {
    console.log(`FAILED: ${e.message}`)
    throw e
  }
}

async function main() {
  if (!existsSync(APK_DIR)) mkdirSync(APK_DIR, { recursive: true })

  console.log("=== CVRL Fashion APK Builder ===\n")

  // Step 1: Enqueue analysis
  await step("1. Enqueue PWA analysis", async () => {
    const res = await fetch(
      `https://pwabuilder.com/api/analyses/enqueue?url=${encodeURIComponent(PWA_URL)}`,
      { method: "POST" }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
    global.analysisId = await res.text()
    console.log(`ID: ${global.analysisId}`)
  })

  // Step 2: Poll for analysis completion
  await step("2. Wait for analysis", async () => {
    for (let i = 0; i < 30; i++) {
      await sleep(3000)
      const res = await fetch(
        `https://pwabuilder.com/api/analyses?id=${encodeURIComponent(global.analysisId)}`
      )
      const data = await res.json()
      console.log(`(${i * 3}s) status=${data?.status}`)
      if (data?.status === "Completed" || data?.status === "completed") return
    }
    throw new Error("Analysis timed out")
  })

  // Step 3: Request package generation via cloud API
  await step("3. Generate APK via cloud API", async () => {
    const res = await fetch(
      `https://pwabuilder.com/api/package?url=${encodeURIComponent(PWA_URL)}&platform=android&packageId=${PACKAGE_NAME}&appName=${encodeURIComponent(APP_NAME)}`,
      { method: "POST" }
    )
    if (!res.ok) {
      const text = await res.text()
      console.log(`  API response (${res.status}): ${text.substring(0, 300)}`)
    }

    // Try alternative endpoint
    const res2 = await fetch("https://pwabuilder.com/api/v1/package", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: PWA_URL,
        platform: "android",
        packageId: PACKAGE_NAME,
        appName: APP_NAME,
      }),
    })

    if (res2.ok) {
      const contentType = res2.headers.get("content-type") || ""
      if (contentType.includes("zip") || contentType.includes("octet-stream")) {
        const buf = Buffer.from(await res2.arrayBuffer())
        writeFileSync(UNSIGNED_APK, buf)
        console.log(`  Downloaded: ${(buf.length / 1024 / 1024).toFixed(2)} MB`)
        return
      }
      const text = await res2.text()
      console.log(`  v1 API response: ${text.substring(0, 300)}`)
    }

    // Fallback: try Azure cloud packaging API
    try {
      const res3 = await fetch(
        `https://pwabuilder-cloudapk.azurewebsites.net/api/generateAppPackage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: PWA_URL,
            appName: APP_NAME,
            launcherName: "CVRL Fashion",
            packageId: PACKAGE_NAME,
            version: "1.0.0",
          }),
        }
      )
      if (res3.ok) {
        const buf = Buffer.from(await res3.arrayBuffer())
        writeFileSync(UNSIGNED_APK, buf)
        console.log(`  Downloaded from cloud: ${(buf.length / 1024 / 1024).toFixed(2)} MB`)
        return
      }
      console.log(`  Cloud API: HTTP ${res3.status}`)
    } catch (e) {
      console.log(`  Cloud API: ${e.message}`)
    }

    throw new Error("All API methods failed")
  })

  // Step 4: Sign the APK
  if (existsSync(UNSIGNED_APK) && require("fs").statSync(UNSIGNED_APK).size > 100000) {
    await step("4. ZipAlign + Sign APK", async () => {
      const alignedApk = UNSIGNED_APK.replace(".apk", "-aligned.apk")
      execSync(`"${BUILD_TOOLS}/zipalign.exe" -v 4 "${UNSIGNED_APK}" "${alignedApk}"`, {
        stdio: "pipe",
      })
      execSync(
        `"${BUILD_TOOLS}/apksigner.bat" sign --ks "${KEYSTORE}" --ks-pass pass:latif4321 --ks-key-alias cvrl --out "${SIGNED_APK}" "${alignedApk}"`,
        { stdio: "pipe" }
      )
    })

    // Step 5: Verify
    await step("5. Verify signature", async () => {
      execSync(`"${BUILD_TOOLS}/apksigner.bat" verify "${SIGNED_APK}"`, { stdio: "pipe" })
    })

    const size = require("fs").statSync(SIGNED_APK).size
    console.log(`\n✅ APK siap: ${SIGNED_APK}`)
    console.log(`   Ukuran: ${(size / 1024 / 1024).toFixed(2)} MB`)
  } else {
    console.log("\n⚠️  Unsigned APK terlalu kecil atau tidak ada. Gunakan APK yang sudah ada.")
    console.log(`   File unsigned: ${UNSIGNED_APK}`)
  }
}

main().catch((err) => {
  console.error(`\n❌ Gagal: ${err.message}`)
  process.exit(1)
})
