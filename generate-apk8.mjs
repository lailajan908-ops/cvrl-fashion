import puppeteer from "puppeteer"

const PWA_URL = "https://cvrl-fashion.vercel.app"

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

page.on("console", (msg) => {
  const t = msg.text()
  if (t.includes("error") || t.includes("Error") || t.includes("Uncaught")) {
    console.log("CONSOLE:", msg.type(), t.substring(0, 300))
  }
})
page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message))

try {
  console.log("Navigate to reportcard...")
  await page.goto(`https://pwabuilder.com/reportcard?site=${encodeURIComponent(PWA_URL)}`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  })

  // Wait for app-report to appear
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000))
    
    const reportRendered = await page.evaluate(() => {
      const appReport = document.querySelector("app-index")?.shadowRoot
        ?.querySelector("#router-outlet app-report")
      if (!appReport?.shadowRoot) return "WAITING"
      const innerHTML = appReport.shadowRoot.innerHTML.substring(0, 1000)
      return innerHTML
    })
    
    if (reportRendered && reportRendered !== "WAITING") {
      console.log(`App-report rendered at ${i + 1}s:`)
      console.log(reportRendered)
      break
    }
    
    if (i === 29) {
      console.log("Timeout waiting for app-report. Final check:")
      const final = await page.evaluate(() => {
        const appReport = document.querySelector("app-index")?.shadowRoot
          ?.querySelector("#router-outlet app-report")
        return {
          exists: !!appReport,
          hasShadow: !!appReport?.shadowRoot,
          children: appReport?.shadowRoot?.children.length
        }
      })
      console.log(final)
    }
  }
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
