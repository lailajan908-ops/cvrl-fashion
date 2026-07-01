import puppeteer from "puppeteer"
import { createWriteStream, existsSync, mkdirSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const APK_DIR = path.join(ROOT, "android-package")
const APK_PATH = path.join(APK_DIR, "cvrl-fashion-store.apk")

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  console.log("=== CV RL Fashion APK Generator (PWABuilder) ===\n")

  const pwaUrl = "https://cvrl-fashion.vercel.app/store"
  console.log(`PWA URL: ${pwaUrl}`)

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  try {
    const page = await browser.newPage()

    // Set download path for browser downloads
    await page._client().send("Browser.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: APK_DIR,
      eventsEnabled: true,
    })

    console.log("1. Loading PWABuilder report card...")
    await page.goto(
      `https://pwabuilder.com/reportcard?site=${encodeURIComponent(pwaUrl)}`,
      { waitUntil: "networkidle2", timeout: 30000 }
    )
    await sleep(4000)

    // Click "Download Test Package" button in shadow DOM
    console.log("2. Clicking 'Download Test Package'...")
    const clicked = await page.evaluate(() => {
      const ai = document.querySelector("app-index")?.shadowRoot
      const ar = ai?.querySelector("app-report")?.shadowRoot
      if (!ar) return false
      const btns = ar.querySelectorAll("button")
      for (const b of btns) {
        if ((b.textContent || "").includes("Download Test Package")) {
          b.click()
          return true
        }
      }
      return false
    })
    console.log(`   Button clicked: ${clicked}`)

    // Wait and monitor for download
    console.log("3. Waiting for cloud build...")
    for (let i = 0; i < 120; i++) {
      await sleep(5000)

      // Check for downloaded files
      if (existsSync(APK_DIR)) {
        const files = await fs.promises.readdir(APK_DIR)
        const apk = files.find(f => f.endsWith(".apk"))
        if (apk) {
          console.log(`\n✅ APK downloaded: ${apk}`)
          const oldPath = path.join(APK_DIR, apk)
          if (apk !== "cvrl-fashion-store.apk") {
            await fs.promises.rename(oldPath, APK_PATH)
          }
          const stat = await fs.promises.stat(APK_PATH)
          console.log(`   Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`)
          return
        }
      }

      // Read button text to check for download link
      const status = await page.evaluate(() => {
        const ar = document.querySelector("app-index")?.shadowRoot
          ?.querySelector("app-report")?.shadowRoot
        if (!ar) return "no shadow"
        const btns = ar.querySelectorAll("button")
        for (const b of btns) {
          const t = (b.textContent || "").trim()
          if (t.includes("Download") || t.includes("download")) return t.substring(0, 100)
        }
        return ar.textContent?.substring(0, 200) || "empty"
      })
      console.log(`   ${i * 5}s: ${status.substring(0, 80)}`)
    }

    console.log("\n⚠️  Timed out waiting for cloud build.")
    console.log("   Check android-package/ folder for any downloaded files.")
    console.log("\n   Manual: https://pwabuilder.com/reportcard?site=" + encodeURIComponent(pwaUrl))

  } catch (err) {
    console.error("\n❌ Error:", err.message)
  } finally {
    await browser.close()
  }
}

main()
