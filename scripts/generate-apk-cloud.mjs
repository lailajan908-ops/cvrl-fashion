import puppeteer from "puppeteer"
import { createWriteStream, existsSync, mkdirSync, statSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const APK_DIR = path.join(ROOT, "android-package")
const APK_PATH = path.join(APK_DIR, "cvrl-fashion-store.apk")

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function generateWithAppmaker(pwaUrl) {
  console.log(`Generating APK via AppMaker for: ${pwaUrl}`)

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })

    // Track download
    const client = await page.target().createCDPSession()
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: APK_DIR,
    })

    console.log("1. Navigating to AppMaker...")
    await page.goto("https://appmaker.xyz/pwa-to-apk", {
      waitUntil: "networkidle2",
      timeout: 20000,
    })

    await sleep(2000)

    console.log("2. Entering URL...")
    const input = await page.$('input[type="url"]')
    if (!input) throw new Error("URL input not found")

    await input.click({ clickCount: 3 })
    await input.type(pwaUrl, { delay: 30 })
    await sleep(500)

    console.log("3. Clicking convert button...")
    const btn = await page.$('button[type="submit"], button:has-text("Convert"), button:has-text("Generate"), input[type="submit"]')
    if (btn) {
      await btn.click()
    } else {
      // Try pressing Enter
      await page.keyboard.press("Enter")
    }

    console.log("4. Waiting for processing...")
    for (let i = 0; i < 60; i++) {
      await sleep(3000)

      // Check for download link or completion
      const pageContent = await page.evaluate(() => document.body.innerText.substring(0, 500))

      if (pageContent.includes("download") || page.url().includes("download")) {
        console.log(`   Processing complete at ${i * 3}s`)
        break
      }
      console.log(`   Processing... (${i * 3}s)`)
    }

    await sleep(5000)

    // Look for download links
    const downloadUrl = await page.evaluate(() => {
      const links = document.querySelectorAll("a")
      for (const link of links) {
        const href = link.getAttribute("href") || ""
        if (href.includes(".apk") || href.includes("download") || link.textContent?.toLowerCase().includes("download")) {
          if (href.startsWith("http")) return href
          return new URL(href, window.location.origin).href
        }
      }
      return null
    })

    if (downloadUrl) {
      console.log(`5. Downloading APK from: ${downloadUrl}`)
      const res = await fetch(downloadUrl)
      if (!existsSync(APK_DIR)) mkdirSync(APK_DIR, { recursive: true })
      const writer = createWriteStream(APK_PATH)
      await new Promise((resolve, reject) => {
        res.body.pipe(writer)
        writer.on("finish", resolve)
        writer.on("error", reject)
      })
      const size = statSync(APK_PATH).size
      console.log(`\n✅ APK saved: ${APK_PATH}`)
      console.log(`   Size: ${(size / 1024 / 1024).toFixed(2)} MB`)
      return true
    }

    // Check if APK was downloaded automatically
    const files = await fs.promises.readdir(APK_DIR)
    const apkFile = files.find(f => f.endsWith(".apk"))
    if (apkFile) {
      const oldPath = path.join(APK_DIR, apkFile)
      const size = statSync(oldPath).size
      console.log(`\n✅ APK found: ${oldPath} (${(size / 1024 / 1024).toFixed(2)} MB)`)
      return true
    }

    console.log("   No download link found. Trying alternative service...")
    return false
  } catch (err) {
    console.log(`   AppMaker error: ${err.message}`)
    return false
  } finally {
    await browser.close()
  }
}

async function generateWithPwabuilderDirect(pwaUrl) {
  console.log(`\nTrying PWABuilder.com for: ${pwaUrl}`)

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  try {
    const page = await browser.newPage()

    console.log("1. Loading PWABuilder report card...")
    await page.goto(`https://pwabuilder.com/reportcard?site=${encodeURIComponent(pwaUrl)}`, {
      waitUntil: "networkidle2",
      timeout: 20000,
    })
    await sleep(3000)

    const html = await page.content()
    console.log(`   Page contains: ${html.substring(1000, 2000)}...`)
    console.log(`   Title: ${await page.title()}`)

    return false
  } catch (err) {
    console.log(`   PWABuilder error: ${err.message}`)
    return false
  } finally {
    await browser.close()
  }
}

async function main() {
  console.log("=== CV RL Fashion APK Generator ===\n")

  const deployedUrl = "https://cvrl-fashion.vercel.app/store"

  let success = await generateWithAppmaker(deployedUrl)
  
  if (!success) {
    success = await generateWithPwabuilderDirect(deployedUrl)
  }

  if (!success) {
    console.log("\n❌ Could not generate APK via cloud services.")
    console.log("\nAlternative options:")
    console.log("  1. Open Android Studio, import android-package/ folder")
    console.log("  2. Build -> Build Bundle(s) / APK(s) -> Build APK")
    console.log("  3. The signed APK will be in app/build/outputs/apk/release/")
    console.log("\nOr use PWABuilder manually:")
    console.log("  Visit: https://pwabuilder.com/publish?url=https://cvrl-fashion.vercel.app/store")
    console.log("  Click 'Package for Android' and download the APK")
  }
}

main().catch(err => {
  console.error("Fatal:", err.message)
  process.exit(1)
})
