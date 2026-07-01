import puppeteer from "puppeteer"

const PWA_URL = "https://cvrl-fashion.vercel.app"

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

try {
  console.log("1. Buka PWABuilder...")
  await page.goto("https://pwabuilder.com", { waitUntil: "networkidle2", timeout: 30000 })
  await new Promise(r => setTimeout(r, 3000))

  console.log("2. Ketik URL...")
  await page.evaluate((url) => {
    const appIndex = document.querySelector("app-index")?.shadowRoot
    const appHome = appIndex?.querySelector("#router-outlet app-home")?.shadowRoot
    const input = appHome?.querySelector("sl-input")
    const nativeInput = input?.shadowRoot?.querySelector("input")
    if (nativeInput) {
      nativeInput.value = url
      nativeInput.dispatchEvent(new Event("input", { bubbles: true }))
    }
  }, PWA_URL)

  await new Promise(r => setTimeout(r, 1000))

  console.log("3. Klik Start...")
  await page.evaluate(() => {
    const appIndex = document.querySelector("app-index")?.shadowRoot
    const appHome = appIndex?.querySelector("#router-outlet app-home")?.shadowRoot
    const btn = appHome?.querySelector('[class*="primary"], [class*="start"], button[class]')
    btn?.click()
  })

  await new Promise(r => setTimeout(r, 3000))
  console.log("4. URL setelah klik:", page.url())

  await new Promise(r => setTimeout(r, 10000))

  const text = await page.evaluate(() => document.body.innerText.substring(0, 2000))
  console.log("5. Body text:", text)
  console.log("6. URL akhir:", page.url())

  const links = await page.evaluate(() => [...document.querySelectorAll("a")].map(a => a.href).filter(h => h.includes(".apk") || h.includes("download")))
  console.log("7. APK links:", links)
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
