import puppeteer from "puppeteer"

const PWA_URL = "https://cvrl-fashion.vercel.app"

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

page.on("console", (msg) => console.log("CONSOLE:", msg.type(), msg.text().substring(0, 200)))
page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message))

try {
  console.log("Navigate to reportcard...")
  await page.goto(`https://pwabuilder.com/reportcard?site=${encodeURIComponent(PWA_URL)}`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  })
  await new Promise(r => setTimeout(r, 15000))

  const fullHTML = await page.evaluate(() => {
    const appIndex = document.querySelector("app-index")
    if (!appIndex) return "NO APP-INDEX"
    const root = appIndex.shadowRoot
    if (!root) return "NO SHADOW ROOT"
    return root.innerHTML.substring(0, 5000)
  })
  console.log("Full shadow HTML (first 5000):", fullHTML)
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
