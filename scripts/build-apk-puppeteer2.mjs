import puppeteer from "puppeteer"
import { writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const APK_DIR = path.join(ROOT, "build-apk")
if (!existsSync(APK_DIR)) mkdirSync(APK_DIR, { recursive: true })

const PWA_URL = "https://cvrl-fashion.vercel.app"

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

const cdp = await page.target().createCDPSession()
await cdp.send("Browser.setDownloadBehavior", {
  behavior: "allow",
  downloadPath: APK_DIR,
  eventsEnabled: true,
})

try {
  console.log("1. Navigate to PWABuilder...")
  await page.goto(`https://pwabuilder.com/reportcard?site=${encodeURIComponent(PWA_URL)}`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  })

  console.log("2. Wait for report to load...")
  for (let i = 0; i < 60; i++) {
    await sleep(1000)
    const ready = await page.evaluate(() => {
      const r = document.querySelector("app-index")?.shadowRoot
        ?.querySelector("#router-outlet app-report")?.shadowRoot
      return r && !r.innerHTML.includes("skeleton")
    })
    if (ready) { console.log(`   Ready at ${i + 1}s`); break }
  }

  // Navigate to publish page directly
  console.log("3. Navigate to publish page...")
  await page.goto(`https://pwabuilder.com/publish?site=${encodeURIComponent(PWA_URL)}`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  })
  await sleep(5000)

  console.log(`   URL: ${page.url()}`)

  // Check publish page content
  const pubText = await page.evaluate(() => {
    const ai = document.querySelector("app-index")?.shadowRoot
    const pr = ai?.querySelector("#router-outlet app-publish")?.shadowRoot
    return pr?.textContent?.substring(0, 2000) || document.body.textContent?.substring(0, 2000) || "no text"
  })
  console.log(`   Publish content: ${pubText.substring(0, 800)}`)

  // Check for Android download in publish page
  const platformBtns = await page.evaluate(() => {
    const ai = document.querySelector("app-index")?.shadowRoot
    const pr = ai?.querySelector("#router-outlet app-publish")?.shadowRoot
    if (!pr) return []
    return [...pr.querySelectorAll("button, a, img, [role=button]")].map(b => ({
      id: b.id,
      text: (b.textContent || "").trim().substring(0, 60),
      alt: b.alt || "",
      title: b.title || "",
      src: (b.src || "").substring(0, 60),
    }))
  })
  console.log(`   Platform buttons: ${JSON.stringify(platformBtns, null, 2).substring(0, 1500)}`)

  // Try alternative: go back to report and click test-download
  console.log("4. Go back and click test-download...")
  await page.goto(`https://pwabuilder.com/reportcard?site=${encodeURIComponent(PWA_URL)}`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  })
  for (let i = 0; i < 30; i++) {
    await sleep(1000)
    const ready = await page.evaluate(() => {
      const r = document.querySelector("app-index")?.shadowRoot
        ?.querySelector("#router-outlet app-report")?.shadowRoot
      return r && !r.innerHTML.includes("skeleton")
    })
    if (ready) break
  }

  await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    r?.querySelector("#test-download")?.click()
  })

  console.log("5. Wait for download...")
  for (let i = 0; i < 60; i++) {
    await sleep(3000)
    const files = readdirSync(APK_DIR).filter(f => f.endsWith(".apk") || f.endsWith(".aab") || f.endsWith(".zip"))
    if (files.length > 0) {
      console.log(`   Found at ${i * 3}s:`)
      files.forEach(f => {
        const st = statSync(path.join(APK_DIR, f))
        console.log(`     ${f} (${(st.size / 1024 / 1024).toFixed(2)} MB)`)
      })
      break
    }
    console.log(`   Waiting... (${i * 3}s)`)
  }

  console.log("\nAll files in APK_DIR:")
  readdirSync(APK_DIR).forEach(f => {
    const st = statSync(path.join(APK_DIR, f))
    console.log(`  ${f} (${(st.size / 1024 / 1024).toFixed(2)} MB)`)
  })

} catch (err) {
  console.error(`Error: ${err.message}`)
} finally {
  await browser.close()
}
