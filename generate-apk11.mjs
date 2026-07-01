import puppeteer from "puppeteer"

const PWA_URL = "https://cvrl-fashion.vercel.app"

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

page.on("pageerror", (err) => console.log("PAGE_ERROR:", err.message))

async function getReportRoot() {
  return await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    return r ? "EXISTS" : "NULL"
  })
}

async function clickButtonInReport(textMatch) {
  return await page.evaluate((match) => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    if (!r) return "NO ROOT"
    const all = r.querySelectorAll("button, a, sl-button, [role=button]")
    for (const el of all) {
      if (el.textContent?.trim().toLowerCase().includes(match)) {
        el.click()
        return "CLICKED: " + el.textContent?.trim().substring(0, 50)
      }
    }
    return "NOT FOUND"
  }, textMatch)
}

async function getVisibleText() {
  return await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    return r?.textContent?.substring(0, 2000) || "NO TEXT"
  })
}

try {
  console.log("1. Navigate to reportcard...")
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

  console.log("2. Click 'Package For Stores'...")
  console.log(await clickButtonInReport("package for stores"))
  await new Promise(r => setTimeout(r, 3000))

  console.log("3. Text after click:")
  console.log(await getVisibleText())

  // Find android-related elements
  const androidElems = await page.evaluate(() => {
    const r = document.querySelector("app-index")?.shadowRoot
      ?.querySelector("#router-outlet app-report")?.shadowRoot
    if (!r) return []
    const results = []
    r.querySelectorAll("*").forEach(el => {
      const text = el.textContent?.trim().toLowerCase() || ""
      if (text.includes("android")) {
        results.push({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 80),
          class: (el.className || "").substring(0, 60)
        })
      }
    })
    return results
  })
  console.log("4. Android elements:", JSON.stringify(androidElems, null, 2))
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
