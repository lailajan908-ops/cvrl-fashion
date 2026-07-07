import { execSync } from "child_process"
import { copyFileSync, existsSync } from "fs"
import { resolve } from "path"

const apkPath = resolve("build-apk/cvrl-fashion-signed.apk")
const zipPath = resolve("build-apk/cvrl-fashion-signed.zip")
const extractDir = resolve("build-apk/extracted")

copyFileSync(apkPath, zipPath)

if (!existsSync(extractDir)) {
  execSync(`mkdir "${extractDir}"`, { shell: true })
}

try {
  execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`, { stdio: "pipe" })
  console.log("Extracted successfully")
} catch (e) {
  console.error("Extract error:", e.message)
}

const { readdirSync, statSync } = await import("fs")
function list(dir, indent = "") {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = resolve(dir, e.name)
    const size = e.isFile() ? ` (${(statSync(full).size / 1024).toFixed(1)} KB)` : ""
    console.log(`${indent}${e.name}${size}`)
    if (e.isDirectory()) list(full, indent + "  ")
  }
}
list(extractDir)
