import puppeteer from "puppeteer"
import { writeFileSync } from "fs"

const URL = "https://cvrl-fashion.vercel.app"

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()

try {
  console.log("Buka PWABuilder...")
  await page.goto("https://pwabuilder.com", { waitUntil: "networkidle2", timeout: 30000 })

  await page.waitForSelector("input", { timeout: 10000 })

  const input = await page.$("input")
  await input.click({ clickCount: 3 })
  await input.type(URL, { delay: 50 })

  await new Promise(r => setTimeout(r, 1000))

  const startBtn = await page.$('button:has-text("Start"), a:has-text("Start"), [type="submit"]')
  if (startBtn) await startBtn.click()

  await new Promise(r => setTimeout(r, 5000))

  const androidTab = await page.$('text=Android, [data-testid="android"], [aria-label="Android"]')
  if (androidTab) await androidTab.click()

  const downloadBtn = await page.waitForSelector('button:has-text("Download"), a:has-text("Download"), text=Download', { timeout: 30000 })
  if (downloadBtn) await downloadBtn.click()

  const response = await page.waitForResponse(
    (res) => res.url().includes(".apk") || res.headers()["content-type"]?.includes("apk"),
    { timeout: 60000 }
  )
  const buffer = await response.buffer()
  writeFileSync("cvrl-fashion.apk", buffer)
  console.log("APK downloaded: cvrl-fashion.apk")
} catch (err) {
  console.error("Gagal:", err.message)
} finally {
  await browser.close()
}
