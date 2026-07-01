import puppeteer from "puppeteer"
import { writeFileSync, mkdirSync, existsSync } from "fs"
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

page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message))

// Track downloads
const downloads = []
page.on("response", async (r) => {
  const url = r.url()
  const ct = r.headers()["content-type"] || ""
  if (url.includes(".apk") || url.includes(".aab") || ct.includes("zip") || ct.includes("octet-stream")) {
    console.log(`  DOWNLOAD: ${url.substring(0, 100)} (${ct})`)
    try {
      const buf = await r.buffer()
      const name = url.split("/").pop() || `download-${Date.now()}.apk`
      const filePath = path.join(APK_DIR, name)
      writeFileSync(filePath, buf)
      console.log(`  Saved: ${name} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`)
      downloads.push(filePath)
    } catch (e) {
      console.log(`  Buffer error: ${e.message}`)
    }
  }
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

  console.log("3. Look for package/download buttons...")
  const buttons = await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    if (!r) return []
    return [...r.querySelectorAll("button, a, [role=button]")].map(b => ({
      id: b.id,
      text: (b.textContent || "").trim().substring(0, 60),
      class: (b.className || "").substring(0, 40),
    }))
  })
  console.log(`   Found ${buttons.length} buttons:`)
  buttons.forEach(b => console.log(`     - #${b.id} "${b.text}"`))

  // Try clicking Package For Stores button
  console.log("4. Click 'Package For Stores'...")
  const clicked = await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    if (!r) return "no shadow root"
    const btn = r.querySelector("#pfs")
    if (btn) { btn.click(); return "clicked #pfs" }
    const all = r.querySelectorAll("button, a, sl-button")
    for (const el of all) {
      const t = (el.textContent || "").trim().toLowerCase()
      if (t.includes("package") || t.includes("store")) {
        el.click(); return "clicked: " + el.textContent?.trim().substring(0, 50)
      }
    }
    return "no matching button found"
  })
  console.log(`   ${clicked}`)
  await sleep(5000)

  // Check what's visible now
  const currentText = await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    return r?.textContent?.substring(0, 2000) || "no content"
  })
  console.log("5. Page content after click:")
  console.log(`   ${currentText.substring(0, 800)}`)

  // Check buttons again
  await sleep(3000)
  const buttons2 = await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    if (!r) return []
    return [...r.querySelectorAll("button, a, [role=button]")].map(b => ({
      id: b.id,
      text: (b.textContent || "").trim().substring(0, 60),
    }))
  })
  console.log("6. Available buttons now:")
  buttons2.forEach(b => console.log(`     - #${b.id} "${b.text}"`))

  // Try clicking Android option or download button
  console.log("7. Try clicking Android/download options...")
  const clicked2 = await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    if (!r) return "no root"
    const all = r.querySelectorAll("button, a, sl-button, [role=button], img")
    for (const el of all) {
      const t = (el.textContent || "").trim().toLowerCase()
      const alt = (el.alt || "").toLowerCase()
      const title = (el.title || "").toLowerCase()
      if (t.includes("android") || alt.includes("android") || title.includes("android") ||
          t.includes("download") || alt.includes("download")) {
        el.click()
        return "clicked: " + (el.textContent || el.alt || el.title || "").trim().substring(0, 50)
      }
    }
    return "no android/download button found"
  })
  console.log(`   ${clicked2}`)
  await sleep(10000)

  console.log("8. Wait for downloads...")
  await sleep(15000)
  
  console.log(`\nDownloads captured: ${downloads.length}`)
  downloads.forEach(d => console.log(`  - ${d}`))

} catch (err) {
  console.error(`Error: ${err.message}`)
} finally {
  await browser.close()
}
