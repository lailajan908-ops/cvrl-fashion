import puppeteer from "puppeteer"

const PWA_URL = "https://cvrl-fashion.vercel.app"

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

try {
  console.log("Buka PWABuilder...")
  await page.goto("https://pwabuilder.com", { waitUntil: "networkidle2", timeout: 30000 })
  await new Promise(r => setTimeout(r, 5000))

  const result = await page.evaluate((url) => {
    const appIndex = document.querySelector("app-index")
    if (!appIndex?.shadowRoot) return "NO APP-INDEX SHADOW"
    const wrapper = appIndex.shadowRoot.querySelector("#wrapper")
    if (!wrapper) return "NO WRAPPER"
    const routerOutlet = wrapper.querySelector("#router-outlet")
    if (!routerOutlet) return "NO ROUTER OUTLET"
    const appHome = routerOutlet.querySelector("app-home")
    if (!appHome?.shadowRoot) return "NO APP-HOME SHADOW"
    const homeRoot = appHome.shadowRoot
    const input = homeRoot.querySelector("sl-input") || homeRoot.querySelector("input")
    if (!input) return "NO INPUT FOUND. HTML: " + homeRoot.innerHTML.substring(0, 500)
    if (input.shadowRoot) {
      const nativeInput = input.shadowRoot.querySelector("input")
      if (nativeInput) {
        nativeInput.value = url
        nativeInput.dispatchEvent(new Event("input", { bubbles: true }))
        nativeInput.dispatchEvent(new Event("change", { bubbles: true }))
        return "TYPED VIA SHADOW INPUT"
      }
    }
    return "INPUT FOUND BUT NO SHADOW INPUT. Tag: " + input.tagName
  }, PWA_URL)
  console.log("Step 1:", result)

  await new Promise(r => setTimeout(r, 2000))

  const clickResult = await page.evaluate(() => {
    const appIndex = document.querySelector("app-index")?.shadowRoot
    const appHome = appIndex?.querySelector("#router-outlet app-home")?.shadowRoot
    if (!appHome) return "NO APP-HOME"
    const startBtn = appHome.querySelector('[class*="start"], [class*="Start"], button, [role="button"]')
    if (!startBtn) return "NO START BUTTON. HTML: " + appHome.innerHTML.substring(0, 500)
    startBtn.click()
    return "CLICKED START"
  })
  console.log("Step 2:", clickResult)

  await new Promise(r => setTimeout(r, 8000))

  const pageHTML = await page.evaluate(() => document.body.innerText.substring(0, 1000))
  console.log("Page after start:", pageHTML)
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
