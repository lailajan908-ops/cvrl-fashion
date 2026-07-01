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
page.on("response", (r) => {
  if (r.url().includes("/api/")) console.log("API:", r.status(), r.url().substring(0, 150))
})

try {
  console.log("1. Navigate langsung ke /reportcard...")
  await page.goto(`https://pwabuilder.com/reportcard?site=${encodeURIComponent(PWA_URL)}`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  })
  await new Promise(r => setTimeout(r, 5000))

  console.log("2. URL:", page.url())
  const text = await page.evaluate(() => document.body.innerText.substring(0, 2000))
  console.log("3. Body:", text)

  await page.screenshot({ path: "reportcard.png", fullPage: false })
  console.log("4. Screenshot saved")
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
