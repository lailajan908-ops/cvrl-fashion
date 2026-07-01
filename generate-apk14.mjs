import puppeteer from "puppeteer"
import { writeFileSync } from "fs"

const PWA_URL = "https://cvrl-fashion.vercel.app"

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message))

const downloads = []
page.on("response", async (r) => {
  const url = r.url()
  const headers = r.headers()
  if (url.includes(".apk") || url.includes(".zip") || headers["content-type"]?.includes("zip") || headers["content-type"]?.includes("octet-stream")) {
    console.log("DOWNLOAD DETECTED:", url)
    try {
      const buffer = await r.buffer()
      const filename = url.split("/").pop() || "package.apk"
      writeFileSync(filename, buffer)
      console.log(`Saved: ${filename} (${buffer.length} bytes)`)
      downloads.push(filename)
    } catch (e) {
      console.log("Download error:", e.message)
    }
  }
})

try {
  console.log("1. Navigate...")
  await page.goto(`https://pwabuilder.com/reportcard?site=${encodeURIComponent(PWA_URL)}`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  })

  // Wait for content
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 1000))
    const done = await page.evaluate(() => {
      const r = document.querySelector("app-index")?.shadowRoot
        ?.querySelector("#router-outlet app-report")?.shadowRoot
      return !r?.innerHTML.includes("skeleton")
    })
    if (done) { console.log(`Ready at ${i + 1}s`); break }
  }

  // Click "Package For Stores" and check for navigation
  await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    r?.querySelector("#pfs")?.click()
  })
  await new Promise(r => setTimeout(r, 3000))
  console.log("URL after PFS click:", page.url())

  // If URL changed, we might be on a different page
  if (page.url().includes("publish") || page.url() !== `https://pwabuilder.com/reportcard?site=${encodeURIComponent(PWA_URL)}`) {
    console.log("Navigated to publish page!")
    const text = await page.evaluate(() => {
      const r = document.querySelector("app-index")?.shadowRoot
        ?.querySelector("#router-outlet app-publish")?.shadowRoot
      return r?.textContent?.substring(0, 2000) || "NO PUBLISH PAGE"
    })
    console.log("Publish page text:", text)
  }

  // Try the test download button
  await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    r?.querySelector("#test-download")?.click()
  })
  await new Promise(r => setTimeout(r, 10000))
  console.log("Downloads captured:", downloads.length)
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
