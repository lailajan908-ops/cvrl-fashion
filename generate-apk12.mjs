import puppeteer from "puppeteer"

const PWA_URL = "https://cvrl-fashion.vercel.app"

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message))

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

  // Click Package For Stores
  await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    const btns = r?.querySelectorAll("button")
    btns?.forEach(b => {
      if (b.textContent?.trim() === "Package For Stores") b.click()
    })
  })
  await new Promise(r => setTimeout(r, 5000))

  // Search for ALL elements containing "store" or "package"
  const storeElements = await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    if (!r) return []
    const results = []
    r.querySelectorAll("*").forEach(el => {
      const text = el.textContent?.trim().toLowerCase() || ""
      if (text.includes("store") || text.includes("package") || text.includes("android") || text.includes("download")) {
        const tag = el.tagName
        const id = el.id || ""
        const cls = (el.className || "").substring(0, 40)
        if (tag !== "SL-ICON" && !results.some(r => r.text === el.textContent?.trim())) {
          results.push({ tag, id, class: cls, text: el.textContent?.trim().substring(0, 100) })
        }
      }
    })
    return results
  })
  console.log("Store/Package elements:", JSON.stringify(storeElements, null, 2))

  // Check for any shadow DOM modals
  const modals = await page.evaluate(() => {
    const appIndex = document.querySelector("app-index")?.shadowRoot
    if (!appIndex) return []
    const allElements = appIndex.querySelectorAll("*")
    const results = []
    allElements.forEach(el => {
      if (el.shadowRoot) {
        results.push({ tag: el.tagName, shadowLen: el.shadowRoot.innerHTML.substring(0, 200) })
      }
    })
    return results
  })
  console.log("Shadow elements:", JSON.stringify(modals, null, 2))
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
