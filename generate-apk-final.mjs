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
  const ct = r.headers()["content-type"] || ""
  if (ct.includes("zip") || ct.includes("octet-stream") || ct.includes("apk")) {
    const url = r.url().substring(0, 100)
    console.log(`DOWNLOAD: ${r.status()} ${url} (${ct})`)
    try {
      const buf = await r.buffer()
      writeFileSync(`download-${Date.now()}.apk`, buf)
      console.log(`Saved ${buf.length} bytes`)
    } catch (e) {
      console.log(`Buffer error: ${e.message}`)
    }
  }
})

try {
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
    if (done) break
  }

  // Use dispatchEvent to trigger the button
  await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    const btn = r?.querySelector("#pfs")
    if (btn) {
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))
    }
  })
  await new Promise(r => setTimeout(r, 5000))

  // Now try clicking the Android image/icons in actions footer
  await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    const footer = r?.querySelector("#actions-footer")
    const androidImg = footer?.querySelector('img[title="Android"]')
    if (androidImg) {
      androidImg.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))
    }
  })
  await new Promise(r => setTimeout(r, 5000))

  // Check if anything appeared
  const text = await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    return r?.textContent?.substring(0, 1000)
  })
  console.log("Current page text:", text)
  console.log("Current URL:", page.url())
  console.log("Downloads found:", downloads.length)
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
