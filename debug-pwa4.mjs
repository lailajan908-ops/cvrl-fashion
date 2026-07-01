import puppeteer from "puppeteer"

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

page.on("console", (msg) => console.log("CONSOLE:", msg.type(), msg.text()))
page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message))

try {
  await page.goto("https://pwabuilder.com", { waitUntil: "domcontentloaded", timeout: 30000 })
  await new Promise(r => setTimeout(r, 8000))

  const rootApp = await page.evaluate(() => {
    const appIndex = document.querySelector("app-index")
    if (!appIndex) return "NO APP-INDEX"
    const root = appIndex.shadowRoot
    if (!root) return "NO SHADOW ROOT"
    return root.innerHTML.substring(0, 2000)
  })
  console.log("Shadow root HTML:", rootApp)
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
