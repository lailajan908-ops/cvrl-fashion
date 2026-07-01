import puppeteer from "puppeteer"

const PWA_URL = "https://cvrl-fashion.vercel.app"

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message))
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("CONSOLE_ERROR:", msg.text().substring(0, 200))
})

try {
  console.log("1. Navigate...")
  await page.goto(`https://pwabuilder.com/reportcard?site=${encodeURIComponent(PWA_URL)}`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  })

  // Wait for content to load
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 1000))
    const done = await page.evaluate(() => {
      const r = document.querySelector("app-index")?.shadowRoot
        ?.querySelector("#router-outlet app-report")?.shadowRoot
      return !r?.innerHTML.includes("skeleton")
    })
    if (done) { console.log(`Ready at ${i + 1}s`); break }
  }

  // Check the HTML of the package section
  const packageHTML = await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    const packageDiv = r?.querySelector("#package")
    return packageDiv?.innerHTML?.substring(0, 3000) || "NO PACKAGE DIV"
  })
  console.log("Package section HTML:", packageHTML)

  // Check the app-actions section
  const actionsHTML = await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    const actionsDiv = r?.querySelector("#app-actions")
    return actionsDiv?.innerHTML?.substring(0, 3000) || "NO ACTIONS DIV"
  })
  console.log("Actions section HTML:", actionsHTML)

  // Look for any img tags in the reports area
  const images = await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    if (!r) return []
    return [...r.querySelectorAll("img")].map(img => ({
      src: img.src?.substring(0, 100),
      alt: img.alt?.substring(0, 50),
      parentText: img.parentElement?.textContent?.trim().substring(0, 50)
    }))
  })
  console.log("Images:", JSON.stringify(images, null, 2))

  // Try clicking the "Download Test Package" button and see what happens
  await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    const btn = r?.querySelector("#test-download")
    if (btn) btn.click()
  })
  await new Promise(r => setTimeout(r, 3000))
  console.log("URL after test download:", page.url())
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
