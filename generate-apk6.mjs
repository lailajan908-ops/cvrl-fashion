import puppeteer from "puppeteer"

const PWA_URL = "https://cvrl-fashion.vercel.app"

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

try {
  console.log("Navigate to reportcard...")
  await page.goto(`https://pwabuilder.com/reportcard?site=${encodeURIComponent(PWA_URL)}`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  })
  await new Promise(r => setTimeout(r, 8000))

  const shadowContent = await page.evaluate(() => {
    function exploreShadow(el, depth = 0) {
      if (depth > 5) return ""
      let out = ""
      const indent = "  ".repeat(depth)
      if (el.shadowRoot) {
        out += `${indent}[${el.tagName}] shadowRoot\n`
        for (const child of el.shadowRoot.children) {
          out += `${indent}  <${child.tagName}${child.id ? " #" + child.id : ""}>\n`
          if (child.shadowRoot) {
            out += exploreShadow(child, depth + 2)
          }
          const text = child.textContent?.trim().substring(0, 100)
          if (text) out += `${indent}    text: "${text}"\n`
        }
      }
      for (const child of el.children) {
        if (!child.shadowRoot) {
          out += exploreShadow(child, depth + 1)
        }
      }
      return out
    }
    const appIndex = document.querySelector("app-index")
    return exploreShadow(appIndex)
  })
  console.log("Shadow tree:", shadowContent)

  const allLinks = await page.evaluate(() => {
    const links = []
    document.querySelectorAll("a").forEach(a => {
      if (a.href.includes("apk") || a.href.includes("download") || a.href.includes("package")) {
        links.push(a.href)
      }
    })
    return links
  })
  console.log("Links:", allLinks)

  // Try clicking Android package button
  await page.evaluate(() => {
    const findBtn = (root) => {
      if (!root) return null
      for (const el of root.querySelectorAll("*")) {
        if (el.textContent?.toLowerCase().includes("android")) return el
      }
      return null
    }
    const appIndex = document.querySelector("app-index")?.shadowRoot
    const btn = findBtn(appIndex)
    if (btn) { console.log("Found android button:", btn.tagName); btn.click() }
  })
  await new Promise(r => setTimeout(r, 5000))
  console.log("URL after click:", page.url())
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
