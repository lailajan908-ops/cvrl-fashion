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
  console.log("Navigate to reportcard...")
  await page.goto(`https://pwabuilder.com/reportcard?site=${encodeURIComponent(PWA_URL)}`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  })

  // Wait for content to load (no skeletons)
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 1000))
    const done = await page.evaluate(() => {
      const r = document.querySelector("app-index")?.shadowRoot
        ?.querySelector("#router-outlet app-report")?.shadowRoot
      return !r?.innerHTML.includes("skeleton")
    })
    if (done) { console.log(`Content ready at ${i + 1}s`); break }
  }

  // Get the full HTML of app-report shadow root for analysis
  const reportHTML = await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    return r?.innerHTML || "NO CONTENT"
  })
  console.log("Report HTML length:", reportHTML.length)

  // Find all buttons/links with Android, Download, Package text
  const buttons = await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    if (!r) return []
    const results = []
    r.querySelectorAll("button, a, sl-button, [role=button]").forEach(el => {
      const text = el.textContent?.trim().toLowerCase() || ""
      if (text.includes("android") || text.includes("download") || text.includes("package")) {
        results.push({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 50),
          href: el.href || "",
          class: el.className?.substring(0, 60)
        })
      }
    })
    return results
  })
  console.log("Relevant buttons:", JSON.stringify(buttons, null, 2))
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
