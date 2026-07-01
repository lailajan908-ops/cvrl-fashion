import puppeteer from "puppeteer"

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

try {
  await page.goto("https://pwabuilder.com", { waitUntil: "domcontentloaded", timeout: 30000 })
  await new Promise(r => setTimeout(r, 8000))

  const allHTML = await page.evaluate(() => {
    function getShadowHTML(el, depth = 0) {
      if (depth > 3) return ""
      let result = ""
      if (el.shadowRoot) {
        result += `${"  ".repeat(depth)}[${el.tagName}] shadowRoot:\n`
        for (const child of el.shadowRoot.children) {
          result += `${"  ".repeat(depth + 1)}<${child.tagName}${child.id ? " id=" + child.id : ""}${child.className ? " class=" + child.className : ""}>\n`
          if (child.shadowRoot) {
            result += getShadowHTML(child, depth + 2)
          }
        }
      }
      return result
    }
    return getShadowHTML(document.querySelector("app-index"))
  })
  console.log("Shadow tree:", allHTML)
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
