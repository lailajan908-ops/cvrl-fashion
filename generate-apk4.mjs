import puppeteer from "puppeteer"

const PWA_URL = "https://cvrl-fashion.vercel.app"

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

page.on("console", (msg) => {
  if (msg.type() !== "verbose") console.log("BROWSER:", msg.type(), msg.text().substring(0, 200))
})

try {
  console.log("1. Buka PWABuilder...")
  await page.goto("https://pwabuilder.com", { waitUntil: "domcontentloaded", timeout: 30000 })
  await new Promise(r => setTimeout(r, 3000))

  console.log("2. Type URL via keyboard...")
  await page.keyboard.type(PWA_URL, { delay: 30 })
  await new Promise(r => setTimeout(r, 1000))

  console.log("3. Press Enter...")
  await page.keyboard.press("Enter")

  await new Promise(r => setTimeout(r, 5000))
  console.log("4. URL:", page.url())
  console.log("5. Body:", (await page.evaluate(() => document.body.innerText)).substring(0, 1000))
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
