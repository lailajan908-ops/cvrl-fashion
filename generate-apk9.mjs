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
  if (t.includes("error") || t.includes("Error")) {
    console.log("CONSOLE:", msg.type(), t.substring(0, 300))
  }
})

try {
  console.log("Navigate to reportcard...")
  await page.goto(`https://pwabuilder.com/reportcard?site=${encodeURIComponent(PWA_URL)}`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  })

  // Wait for skeleton to be replaced with real content
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 1000))
    
    const content = await page.evaluate(() => {
      const appReport = document.querySelector("app-index")?.shadowRoot
        ?.querySelector("#router-outlet app-report")
      if (!appReport?.shadowRoot) return null
      const html = appReport.shadowRoot.innerHTML
      const hasSkeleton = html.includes("skeleton")
      const text = appReport.shadowRoot.textContent?.trim().substring(0, 500)
      return { hasSkeleton, text }
    })
    
    if (content && !content.hasSkeleton) {
      console.log(`Content loaded at ${i + 1}s:`)
      console.log(content.text)
      break
    }
    
    if (i % 10 === 0 && content) {
      console.log(`Still loading (${i + 1}s)... skeleton: ${content.hasSkeleton}`)
    }
  }
  
  // Get the full content
  const fullContent = await page.evaluate(() => {
    const appReport = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")
    if (!appReport?.shadowRoot) return "NO CONTENT"
    const html = appReport.shadowRoot.innerHTML
    const text = appReport.shadowRoot.textContent?.trim()
    return { html: html.substring(0, 5000), text: text?.substring(0, 1000) }
  })
  console.log("\nFull report content:")
  console.log(fullContent.text)
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
