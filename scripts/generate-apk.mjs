import { execSync, spawn } from "child_process"
import { createWriteStream, existsSync, mkdirSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const APK_DIR = path.join(ROOT, "android-package")
const APK_PATH = path.join(APK_DIR, "cvrl-fashion-store.apk")

const PACKAGE_NAME = "com.cvrlfashion.store"
const APP_NAME = "CVRL Fashion Store"

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function getTunnelUrl() {
  return new Promise((resolve, reject) => {
    console.log("Starting localtunnel on port 3000...")
    const proc = spawn("npx", ["lt", "--port", "3000", "--subdomain", "cvrl-store"], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    })
    let resolved = false

    proc.stdout.on("data", (data) => {
      const text = data.toString()
      console.log("  [lt]", text.trim())
      const match = text.match(/https:\/\/[^\s]+/)
      if (match && !resolved) {
        resolved = true
        resolve({ url: match[0].replace(/[^a-zA-Z0-9:/.-]/g, ""), proc })
      }
    })

    proc.stderr.on("data", (data) => {
      const text = data.toString()
      if (text.includes("url")) {
        const match = text.match(/https:\/\/[^\s]+/)
        if (match && !resolved) {
          resolved = true
          resolve({ url: match[0].replace(/[^a-zA-Z0-9:/.-]/g, ""), proc })
        }
      }
    })

    setTimeout(() => {
      if (!resolved) {
        proc.kill()
        reject(new Error("Timeout waiting for tunnel URL"))
      }
    }, 30000)
  })
}

async function buildAndStartServer() {
  console.log("Building Next.js...")
  execSync("npx next build", { cwd: ROOT, stdio: "inherit" })

  console.log("Starting Next.js server on port 3000...")
  const server = spawn("npx", ["next", "start", "-p", "3000"], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: "3000" },
  })

  server.stderr.on("data", (d) => process.stderr.write(d))
  server.stdout.on("data", (d) => {
    const text = d.toString()
    if (text.includes("localhost:3000") || text.includes("ready")) {
      console.log("  Server ready!")
    }
  })

  await sleep(3000)
  return server
}

async function generateWithPwabuilder(pwaUrl) {
  console.log(`\nSending to PWABuilder cloud packaging API...`)
  console.log(`  URL: ${pwaUrl}`)
  console.log(`  Package: ${PACKAGE_NAME}`)
  console.log(`  App Name: ${APP_NAME}`)

  // Step 1: Request packaging
  const packageResponse = await fetch(
    `https://pwabuilder.com/api/package?url=${encodeURIComponent(pwaUrl)}&platform=android&packageId=${PACKAGE_NAME}&appName=${encodeURIComponent(APP_NAME)}`,
    { method: "POST" }
  )

  if (!packageResponse.ok) {
    const text = await packageResponse.text()
    throw new Error(`PWABuilder API error (${packageResponse.status}): ${text.substring(0, 500)}`)
  }

  const packageData = await packageResponse.json()
  console.log("  PWABuilder response:", JSON.stringify(packageData).substring(0, 300))

  // Step 2: Get download URL
  if (packageData?.url || packageData?.downloadUrl) {
    const downloadUrl = packageData.url || packageData.downloadUrl
    console.log(`  Downloading APK from: ${downloadUrl}`)

    const apkResponse = await fetch(downloadUrl)
    if (!apkResponse.ok) throw new Error(`Download failed: ${apkResponse.status}`)

    if (!existsSync(APK_DIR)) mkdirSync(APK_DIR, { recursive: true })
    const fileStream = createWriteStream(APK_PATH)
    await new Promise((resolve, reject) => {
      apkResponse.body.pipe(fileStream)
      apkResponse.body.on("error", reject)
      fileStream.on("finish", resolve)
    })

    const size = (await fs.promises.stat(APK_PATH)).size
    console.log(`\n✅ APK generated: ${APK_PATH}`)
    console.log(`   Size: ${(size / 1024 / 1024).toFixed(2)} MB`)
    return true
  }

  // Step 3: Check if PWABuilder returns a processing URL to poll
  if (packageData?.id || packageData?.processing) {
    const processingId = packageData.id || packageData.processing
    console.log(`  Processing ID: ${processingId}, polling for completion...`)

    for (let i = 0; i < 60; i++) {
      await sleep(5000)
      const statusRes = await fetch(
        `https://pwabuilder.com/api/package/status?id=${processingId}`
      )
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        console.log(`  Status (${i * 5}s): ${statusData?.status || "processing..."}`)
        if (statusData?.status === "complete" || statusData?.downloadUrl) {
          const downloadUrl = statusData.downloadUrl || statusData.url
          if (downloadUrl) {
            console.log(`  Downloading from: ${downloadUrl}`)
            const apkResponse = await fetch(downloadUrl)
            if (!existsSync(APK_DIR)) mkdirSync(APK_DIR, { recursive: true })
            const fileStream = createWriteStream(APK_PATH)
            await new Promise((resolve, reject) => {
              apkResponse.body.pipe(fileStream)
              apkResponse.body.on("error", reject)
              fileStream.on("finish", resolve)
            })
            const stat = await fs.promises.stat(APK_PATH)
            console.log(`\n✅ APK generated: ${APK_PATH}`)
            console.log(`   Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`)
            return true
          }
        }
      }
    }
    throw new Error("Timeout waiting for APK processing")
  }

  // If we got HTML back, try alternative API
  console.log("  Trying alternative PWABuilder API endpoint...")
  return await generateWithBubblewrap(pwaUrl)
}

async function generateWithBubblewrap(pwaUrl) {
  try {
    console.log("  Using pwabuilder-api...")
    const res = await fetch("https://pwabuilder.com/api/v1/package", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: pwaUrl,
        platform: "android",
        packageId: PACKAGE_NAME,
        appName: APP_NAME,
      }),
    })
    if (!res.ok) {
      console.error(`  API error: ${res.status}`)
      return false
    }
    const data = await res.json()
    console.log("  Response:", JSON.stringify(data).substring(0, 300))
    return true
  } catch (err) {
    console.error("  Error:", err.message)
    return false
  }
}

async function main() {
  console.log("=== CV RL Fashion APK Generator ===\n")

  // First try with the deployed URL
  const deployedUrl = "https://cvrl-fashion.vercel.app/store"
  console.log(`Trying deployed URL: ${deployedUrl}`)
  const success = await generateWithPwabuilder(deployedUrl)

  if (success) {
    console.log("\nDone!")
    return
  }

  console.log("\nDeployed URL didn't work, trying local tunnel...")

  // Build and start server
  const server = await buildAndStartServer()

  try {
    // Get tunnel URL
    const { url: tunnelUrl, proc: tunnelProc } = await getTunnelUrl()
    const pwaUrl = `${tunnelUrl}/store`
    console.log(`\nTunnel URL: ${tunnelUrl}`)
    console.log(`PWA URL: ${pwaUrl}`)

    await generateWithPwabuilder(pwaUrl)

    tunnelProc.kill()
  } finally {
    server.kill()
  }
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message)
  process.exit(1)
})
