import puppeteer from "puppeteer"

const URL = "https://cvrl-fashion.vercel.app"

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

try {
  console.log("Navigating to pwabuilder.com...")
  await page.goto("https://pwabuilder.com", { waitUntil: "networkidle0", timeout: 30000 })
  await new Promise(r => setTimeout(r, 3000))

  const html = await page.content()
  console.log("Page title:", await page.title())

  const inputs = await page.$$('input, textarea, [role="textbox"], [contenteditable]')
  console.log(`Found ${inputs.length} input elements`)

  const buttons = await page.$$('button, a, [role="button"]')
  console.log(`Found ${buttons.length} button elements`)

  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500))
  console.log("Body text (first 500 chars):", bodyText)

  await page.screenshot({ path: "pwabuilder-screenshot.png", fullPage: false })
  console.log("Screenshot saved")
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
